import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Client } from 'pg';
import { monitoringRoute } from './monitoring-routes.js';
import { readRuntimeConfig } from './runtime-config.js';
import {
  authorizeOrganization,
  createPersistentSession,
  extractBearerToken,
  resolveSession,
  revokeSession,
  type SessionActor,
} from './security-auth.js';
const config = readRuntimeConfig(process.env);
const { port, databaseUrl } = config;
let client = new Client({ connectionString: databaseUrl });
let isClientConnected = false;
class RequestAuthorizationError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function getDbClient(): Promise<Client> {
  if (!isClientConnected) {
    try {
      await client.connect();
      isClientConnected = true;
    } catch (err: any) {
      if (err.message?.includes('already been connected')) isClientConnected = true;
      else {
        try {
          await client.end();
        } catch {}
        client = new Client({ connectionString: databaseUrl });
        await client.connect();
        isClientConnected = true;
      }
    }
  }
  return client;
}
async function checkDatabaseReady(): Promise<boolean> {
  try {
    const db = await getDbClient();
    await db.query('select 1');
    return true;
  } catch {
    isClientConnected = false;
    return false;
  }
}
function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  response.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(body));
}
function sendProblem(response: ServerResponse, status: number, title: string, detail: string) {
  sendJson(response, status, { type: 'about:blank', title, status, detail });
}
async function readJson(request: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function header(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}
function bearerToken(request: IncomingMessage): string | undefined {
  return extractBearerToken({ authorization: header(request, 'authorization') });
}
async function getAuthenticatedUser(request: IncomingMessage): Promise<SessionActor | undefined> {
  const token = bearerToken(request);
  const scope = organizationScope(request);
  if (!token || !scope) return undefined;
  const db = new Client({ connectionString: databaseUrl });
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query(
      `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
      [scope.tenantId, scope.organizationId],
    );
    const actor = await resolveSession(db, token);
    if (
      !actor ||
      !(await authorizeOrganization(db, actor.identityUserId, scope.tenantId, scope.organizationId))
    ) {
      await db.query('ROLLBACK');
      return undefined;
    }
    await db.query('COMMIT');
    return actor;
  } catch (error) {
    try {
      await db.query('ROLLBACK');
    } catch {}
    throw error;
  } finally {
    await db.end();
  }
}
function organizationScope(request: IncomingMessage) {
  const tenantId = header(request, 'x-tenant-id');
  const organizationId = header(request, 'x-organization-id');
  const isUuid = (value: string | undefined) =>
    Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
  return isUuid(tenantId) && isUuid(organizationId)
    ? { tenantId: tenantId!, organizationId: organizationId! }
    : undefined;
}
async function withOrganizationDatabase<T>(
  request: IncomingMessage,
  actor: SessionActor,
  permission: string | undefined,
  action: (db: Client, scope: { tenantId: string; organizationId: string }) => Promise<T>,
): Promise<T> {
  const scope = organizationScope(request);
  if (!scope) throw new RequestAuthorizationError(403, 'Valid organization scope is required');
  const db = new Client({ connectionString: databaseUrl });
  await db.connect();
  let transaction = false;
  try {
    await db.query('BEGIN');
    transaction = true;
    await db.query(
      `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
      [scope.tenantId, scope.organizationId],
    );
    if (
      !(await authorizeOrganization(
        db,
        actor.identityUserId,
        scope.tenantId,
        scope.organizationId,
        permission,
      ))
    )
      throw new RequestAuthorizationError(403, 'Organization membership or permission denied');
    const result = await action(db, scope);
    await db.query('COMMIT');
    transaction = false;
    return result;
  } catch (error) {
    if (transaction) {
      try {
        await db.query('ROLLBACK');
      } catch {}
    }
    throw error;
  } finally {
    await db.end();
  }
}
function localizedProject(row: any) {
  return {
    id: row.id,
    code: row.project_code,
    projectCode: row.project_code,
    name: row.name_fr,
    nameFr: row.name_fr,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    status: row.status,
    organizationId: row.organization_id,
    organization: 'Organisation Démo',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
async function login(request: IncomingMessage, response: ServerResponse) {
  let body: any;
  try {
    body = await readJson(request);
  } catch {
    return sendProblem(response, 400, 'Invalid JSON', 'Request body is not valid JSON');
  }
  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const password = String(body.password ?? '');
  if (!email || !password)
    return sendProblem(response, 400, 'Validation error', 'Email and password are required');
  if (!(await checkDatabaseReady()))
    return sendProblem(response, 503, 'Database unavailable', 'PostgreSQL is not connected');
  const db = await getDbClient();
  const result = await db.query(
    `select u.id,u.email,u.full_name,r.code as role_code,r.name as role_name from users u join user_roles ur on ur.user_id=u.id join roles r on r.id=ur.role_id where lower(u.email)=$1 and u.is_active=true and u.password_hash=crypt($2,u.password_hash) limit 1`,
    [email, password],
  );
  if (!result.rowCount)
    return sendProblem(response, 401, 'Invalid credentials', 'Email or password is incorrect');
  const user = result.rows[0];
  const token = randomUUID();
  const scope = organizationScope(request);
  if (!scope)
    return sendProblem(response, 401, 'Invalid credentials', 'Email or password is incorrect');
  const sessionDb = new Client({ connectionString: databaseUrl });
  await sessionDb.connect();
  let sessionCreated = false;
  try {
    await sessionDb.query('BEGIN');
    await sessionDb.query(
      `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
      [scope.tenantId, scope.organizationId],
    );
    const linkedIdentity = await sessionDb.query(
      `SELECT i.id FROM identity.auth_user_links l
       JOIN identity.users i ON i.id=l.identity_user_id
       WHERE l.public_user_id=$1 AND i.is_active=true`,
      [user.id],
    );
    sessionCreated = Boolean(
      linkedIdentity.rowCount &&
      (await authorizeOrganization(
        sessionDb,
        linkedIdentity.rows[0].id,
        scope.tenantId,
        scope.organizationId,
      )) &&
      (await createPersistentSession(sessionDb, linkedIdentity.rows[0].id, token)),
    );
    await sessionDb.query(sessionCreated ? 'COMMIT' : 'ROLLBACK');
  } catch (error) {
    try {
      await sessionDb.query('ROLLBACK');
    } catch {}
    throw error;
  } finally {
    await sessionDb.end();
  }
  if (!sessionCreated)
    return sendProblem(response, 401, 'Invalid credentials', 'Email or password is incorrect');
  return sendJson(response, 200, {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      roleCode: user.role_code,
      roleName: user.role_name,
    },
  });
}
async function listKpis(request: IncomingMessage, response: ServerResponse) {
  const actor = await getAuthenticatedUser(request);
  if (!actor) return sendProblem(response, 401, 'Unauthorized', 'A valid bearer token is required');
  const result = await withOrganizationDatabase(request, actor, undefined, (db) =>
    db.query('select * from kpis order by kpi_id'),
  );
  return sendJson(response, 200, {
    items: result.rows,
    total: result.rowCount ?? result.rows.length,
  });
}
async function listAlertRules(request: IncomingMessage, response: ServerResponse) {
  const actor = await getAuthenticatedUser(request);
  if (!actor) return sendProblem(response, 401, 'Unauthorized', 'A valid bearer token is required');
  const { rules, conditions } = await withOrganizationDatabase(
    request,
    actor,
    undefined,
    async (db) => ({
      rules: await db.query('select * from alert_rules where is_active=true order by rule_id'),
      conditions: await db.query('select * from alert_conditions order by alert_rule_id, position'),
    }),
  );
  const items = rules.rows.map((rule: any) => ({
    ...rule,
    conditions: conditions.rows.filter((c: any) => c.alert_rule_id === rule.id),
  }));
  return sendJson(response, 200, { items, total: items.length });
}
async function listProjects(request: IncomingMessage, response: ServerResponse) {
  const actor = await getAuthenticatedUser(request);
  if (!actor) return sendProblem(response, 401, 'Unauthorized', 'A valid bearer token is required');
  const result = await withOrganizationDatabase(request, actor, 'projects.read', (db, scope) =>
    db.query(
      `select p.id,p.project_code,p.name_fr,p.name_ar,p.name_en,p.status,p.organization_id,p.created_at,p.updated_at
       from project.projects p
       where p.tenant_id=$1 and p.organization_id=$2
         and exists (
           select 1 from monitoring.project_members m
           where m.project_id=p.id and m.user_id=$3
         )
       order by p.created_at desc`,
      [scope.tenantId, scope.organizationId, actor.userId],
    ),
  );
  return sendJson(response, 200, {
    items: result.rows.map(localizedProject),
    data: result.rows.map(localizedProject),
    total: result.rowCount ?? result.rows.length,
  });
}
async function createProject(request: IncomingMessage, response: ServerResponse) {
  const actor = await getAuthenticatedUser(request);
  if (!actor) return sendProblem(response, 401, 'Unauthorized', 'A valid bearer token is required');
  let body: any;
  try {
    body = await readJson(request);
  } catch {
    return sendProblem(response, 400, 'Invalid JSON', 'Request body is not valid JSON');
  }
  const code = String(body.code ?? body.projectCode ?? '').trim();
  const nameFr = String(body.nameFr ?? body.name ?? '').trim();
  const nameAr = String(body.nameAr ?? nameFr).trim();
  const nameEn = String(body.nameEn ?? nameFr).trim();
  if (!code || !nameFr)
    return sendProblem(response, 400, 'Validation error', 'code and nameFr are required');
  try {
    const result = await withOrganizationDatabase(request, actor, 'projects.create', (db, scope) =>
      db.query(
        `insert into project.projects (id,tenant_id,organization_id,project_code,name_fr,name_ar,name_en,description_fr,description_ar,description_en,status,version,created_by,updated_by) values ($1,$2,$3,$4,$5,$6,$7,'','','','draft',1,$8,$8) returning id,project_code,name_fr,name_ar,name_en,status,organization_id,created_at,updated_at`,
        [
          randomUUID(),
          scope.tenantId,
          scope.organizationId,
          code,
          nameFr,
          nameAr,
          nameEn,
          actor.userId,
        ],
      ),
    );
    const project = localizedProject(result.rows[0]);
    return sendJson(response, 201, project, {
      etag: `"${project.id}"`,
      location: `/v1/projects/${project.id}`,
    });
  } catch (error: any) {
    if (error instanceof RequestAuthorizationError)
      return sendProblem(response, error.status, 'Forbidden', error.message);
    if (error?.code === '23505')
      return sendProblem(
        response,
        409,
        'Project already exists',
        `Project code "${code}" already exists`,
      );
    console.error('Project creation failed', error);
    return sendProblem(response, 500, 'Database error', 'Project could not be created');
  }
}
async function logout(request: IncomingMessage, response: ServerResponse) {
  const token = bearerToken(request);
  if (token) await revokeSession(await getDbClient(), token);
  return sendJson(response, 200, { loggedOut: true });
}
const server = createServer(async (request, response) => {
  const origin = header(request, 'origin');
  if (origin) response.setHeader('vary', 'Origin');
  if (origin && config.corsAllowedOrigins.has(origin))
    response.setHeader('access-control-allow-origin', origin);
  response.setHeader(
    'access-control-allow-methods',
    'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
  );
  response.setHeader(
    'access-control-allow-headers',
    'Content-Type, Authorization, Accept, X-Tenant-Id, X-Organization-Id, Idempotency-Key',
  );
  response.setHeader('access-control-max-age', '600');
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    .pathname;
  try {
    if (request.method === 'POST' && pathname === '/v1/auth/logout')
      return await logout(request, response);
    if (pathname.startsWith('/v1/monitoring/')) {
      if (
        await monitoringRoute(
          request,
          response,
          pathname,
          await getAuthenticatedUser(request),
          databaseUrl,
        )
      )
        return;
    }
    if (request.method === 'GET' && pathname === '/health/live')
      return sendJson(response, 200, { status: 'alive' });
    if (request.method === 'GET' && pathname === '/health/ready') {
      const ready = await checkDatabaseReady();
      return sendJson(response, ready ? 200 : 503, {
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        database: ready,
      });
    }
    if (request.method === 'POST' && pathname === '/v1/auth/login')
      return await login(request, response);
    if (request.method === 'GET' && pathname === '/v1/kpis')
      return await listKpis(request, response);
    if (request.method === 'GET' && pathname === '/v1/alert-rules')
      return await listAlertRules(request, response);
    if (request.method === 'GET' && pathname === '/v1/projects')
      return await listProjects(request, response);
    if (request.method === 'POST' && pathname === '/v1/projects')
      return await createProject(request, response);
    return sendProblem(response, 404, 'Not Found', 'Route not found');
  } catch (error) {
    if (error instanceof RequestAuthorizationError)
      return sendProblem(response, error.status, 'Forbidden', error.message);
    console.error('Unhandled request error', error);
    return sendProblem(response, 500, 'Internal Server Error', 'Unexpected server error');
  }
});
server.listen(port, '0.0.0.0', () => console.log(`API listening on 0.0.0.0:${port}`));
