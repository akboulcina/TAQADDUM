import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Client } from 'pg';

const port = Number(process.env['PORT'] ?? 3000);

const databaseUrl =
  process.env['DATABASE_URL'] ??
  'postgresql://taqaddum:taqaddum_local_only@postgres:5432/taqaddum';

let client = new Client({ connectionString: databaseUrl });
let isClientConnected = false;

async function getDbClient(): Promise<Client> {
  if (!isClientConnected) {
    try {
      await client.connect();
      isClientConnected = true;
    } catch (err: any) {
      if (err.message && err.message.includes('already been connected')) {
        isClientConnected = true;
      } else {
        try { await client.end(); } catch (_) {}
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
  } catch (error) {
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

function sendProblem(
  response: ServerResponse,
  status: number,
  title: string,
  detail: string,
) {
  sendJson(response, status, {
    type: 'about:blank',
    title,
    status,
    detail,
  });
}

async function readJson(request: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function header(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
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

async function listProjects(request: IncomingMessage, response: ServerResponse) {
  const isReady = await checkDatabaseReady();
  if (!isReady) {
    return sendProblem(response, 503, 'Database unavailable', 'PostgreSQL is not connected');
  }

  const db = await getDbClient();
  const tenantId = header(request, 'x-tenant-id');
  const result = tenantId
    ? await db.query(
        `select id, project_code, name_fr, name_ar, name_en, status, organization_id, created_at, updated_at
         from project.projects where tenant_id::text = $1 order by created_at desc`,
        [tenantId],
      )
    : await db.query(
        `select id, project_code, name_fr, name_ar, name_en, status, organization_id, created_at, updated_at
         from project.projects order by created_at desc`,
      );

  return sendJson(response, 200, {
    items: result.rows.map(localizedProject),
    data: result.rows.map(localizedProject),
    total: result.rowCount ?? result.rows.length,
  });
}

async function createProject(request: IncomingMessage, response: ServerResponse) {
  const isReady = await checkDatabaseReady();
  if (!isReady) {
    return sendProblem(response, 503, 'Database unavailable', 'PostgreSQL is not connected');
  }

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

  if (!code || !nameFr) {
    return sendProblem(response, 400, 'Validation error', 'code and nameFr are required');
  }

  const tenantId = header(request, 'x-tenant-id');
  const organizationId = header(request, 'x-organization-id');

  if (!tenantId || !organizationId) {
    return sendProblem(response, 400, 'Missing context', 'X-Tenant-Id and X-Organization-Id headers are required');
  }

  const actorId = header(request, 'x-actor-id');
  const db = await getDbClient();

  try {
    const result = await db.query(
      `insert into project.projects (
        id, tenant_id, organization_id, project_code, name_fr, name_ar, name_en,
        description_fr, description_ar, description_en, status, version, created_by, updated_by
      ) values ($1, $2, $3, $4, $5, $6, $7, '', '', '', 'draft', 1, $8, $8)
      returning id, project_code, name_fr, name_ar, name_en, status, organization_id, created_at, updated_at`,
      [randomUUID(), tenantId, organizationId, code, nameFr, nameAr, nameEn, actorId ?? randomUUID()],
    );

    const project = localizedProject(result.rows[0]);
    return sendJson(response, 201, project, {
      etag: `"${project.id}"`,
      location: `/v1/projects/${project.id}`,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return sendProblem(response, 409, 'Project already exists', `Project code "${code}" already exists`);
    }
    console.error('Project creation failed', error);
    return sendProblem(response, 500, 'Database error', 'Project could not be created');
  }
}

const server = createServer(async (request, response) => {
  const allowedOrigins = new Set([
    'http://localhost:5173',
    'https://zany-halibut-x55gvqwj95jrcvvj-5173.app.github.dev',
  ]);

  const requestOrigin = header(request, 'origin');

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    response.setHeader('access-control-allow-origin', requestOrigin);
    response.setHeader('vary', 'Origin');
    response.setHeader('access-control-allow-credentials', 'true');
  }

  response.setHeader(
    'access-control-allow-methods',
    'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
  );

  response.setHeader(
    'access-control-allow-headers',
    'Content-Type, Authorization, Accept, X-Tenant-Id, X-Organization-Id, X-Actor-Id, Idempotency-Key',
  );

  response.setHeader('access-control-max-age', '600');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (request.method === 'GET' && pathname === '/health/live') {
      return sendJson(response, 200, { status: 'alive' });
    }

    if (request.method === 'GET' && pathname === '/health/ready') {
      const dbReady = await checkDatabaseReady();
      return sendJson(response, dbReady ? 200 : 503, {
        status: dbReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        database: dbReady,
      });
    }

    if (request.method === 'GET' && pathname === '/v1/projects') {
      return await listProjects(request, response);
    }

    if (request.method === 'POST' && pathname === '/v1/projects') {
      return await createProject(request, response);
    }

    return sendProblem(response, 404, 'Not Found', 'Route not found');
  } catch (error) {
    console.error('Unhandled request error', error);
    return sendProblem(response, 500, 'Internal Server Error', 'Unexpected server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${port}`);
});
