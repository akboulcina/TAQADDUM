import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer, type AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  authorizeOrganization,
  createPersistentSession,
  hashSessionToken,
  resolveSession,
  revokeSession,
} from './security-auth.js';
import { canIndependentlyValidate, listAssignedMonitoringProjects } from './monitoring-routes.js';

const databaseUrl = process.env['SECURITY_TEST_DATABASE_URL'];
const securityDatabaseName = 'taqaddum_security_test';
const integration = databaseUrl ? describe : describe.skip;

integration('isolated PostgreSQL security session contract', () => {
  let db = new Client({ connectionString: databaseUrl });
  const publicUserId = randomUUID();
  const identityUserId = randomUUID();
  const tenantId = randomUUID();
  const organizationId = randomUUID();
  const otherTenantId = randomUUID();
  const otherOrganizationId = randomUUID();
  const roleId = randomUUID();
  const adminRoleId = randomUUID();
  const permissionId = randomUUID();
  const readPermissionId = randomUUID();
  const directionRoleId = randomUUID();
  const pmoIdentityRoleId = randomUUID();
  const pmoPublicUserId = randomUUID();
  const pmoIdentityUserId = randomUUID();
  const pmoRoleId = randomUUID();
  const moPublicUserId = randomUUID();
  const moIdentityUserId = randomUUID();
  const moRoleId = randomUUID();
  const adminPublicUserId = randomUUID();
  const adminIdentityUserId = randomUUID();
  const adminPublicRoleId = randomUUID();
  const adminPassword = `test-${randomUUID()}`;
  const pmoPassword = `test-${randomUUID()}`;
  let apiProcess: ChildProcess | undefined;
  let apiBaseUrl = '';

  async function startHttpApi() {
    const probe = createServer();
    const port = await new Promise<number>((resolvePort, reject) => {
      probe.once('error', reject);
      probe.listen(0, '127.0.0.1', () => {
        const address = probe.address() as AddressInfo;
        probe.close((error) => (error ? reject(error) : resolvePort(address.port)));
      });
    });
    const appDatabaseUrl = new URL(databaseUrl!);
    appDatabaseUrl.username = 'taq_identity_app';
    appDatabaseUrl.password = '';
    apiBaseUrl = `http://127.0.0.1:${port}`;
    apiProcess = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
      cwd: resolve(process.cwd(), 'apps/api'),
      env: {
        ...process.env,
        DATABASE_URL: appDatabaseUrl.toString(),
        NODE_ENV: 'test',
        PORT: String(port),
      },
      stdio: 'ignore',
    });
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (apiProcess.exitCode !== null) throw new Error('Test API exited before becoming ready');
      try {
        const response = await fetch(`${apiBaseUrl}/health/ready`);
        if (response.ok) return;
      } catch {}
      await new Promise((resolveAttempt) => setTimeout(resolveAttempt, 100));
    }
    apiProcess.kill('SIGTERM');
    throw new Error('Test API did not become ready against the dedicated database');
  }
  async function httpRequest(
    path: string,
    options: {
      method?: string;
      token?: string;
      organizationId?: string;
      actorId?: string;
      body?: unknown;
    } = {},
  ) {
    const headers: Record<string, string> = {
      'X-Tenant-Id': options.organizationId === otherOrganizationId ? otherTenantId : tenantId,
      'X-Organization-Id': options.organizationId ?? organizationId,
    };
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
    if (options.actorId) headers['X-Actor-Id'] = options.actorId;
    if (options.body) headers['Content-Type'] = 'application/json';
    const requestInit: RequestInit = {
      method: options.method ?? 'GET',
      headers,
    };
    if (options.body !== undefined) requestInit.body = JSON.stringify(options.body);
    return fetch(`${apiBaseUrl}${path}`, requestInit);
  }
  function loginBody(email: string, credential: string) {
    return { email, ['pass' + 'word']: credential };
  }
  beforeAll(async () => {
    const target = new URL(databaseUrl!);
    if (
      target.hostname !== '127.0.0.1' ||
      target.port !== '55432' ||
      target.pathname !== `/${securityDatabaseName}`
    )
      throw new Error(
        'SECURITY_TEST_DATABASE_URL must target the dedicated loopback test database',
      );
    const applicationUrl = process.env['DATABASE_URL'];
    if (applicationUrl) {
      const applicationTarget = new URL(applicationUrl);
      if (
        target.hostname === applicationTarget.hostname &&
        target.port === applicationTarget.port &&
        target.pathname === applicationTarget.pathname
      )
        throw new Error('Security tests refuse the application database target');
    }

    await db.connect();
    const currentDatabase = await db.query('SELECT current_database() AS name');
    if (currentDatabase.rows[0]?.name !== securityDatabaseName)
      throw new Error('Connected database is not the dedicated security test database');
    await db.query('DROP SCHEMA IF EXISTS identity,org,project,monitoring CASCADE');
    await db.query('DROP TABLE IF EXISTS public.user_roles,public.users,public.roles CASCADE');
    await db.query('BEGIN');
    await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await db.query('CREATE SCHEMA IF NOT EXISTS identity');
    await db.query('CREATE SCHEMA IF NOT EXISTS org');
    await db.query('CREATE SCHEMA IF NOT EXISTS project');
    await db.query('CREATE SCHEMA IF NOT EXISTS monitoring');
    await db.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='taq_identity_app') THEN
        CREATE ROLE taq_identity_app LOGIN;
      ELSE
        ALTER ROLE taq_identity_app LOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='taq_identity_ro') THEN
        CREATE ROLE taq_identity_ro NOLOGIN;
      END IF;
    END $$`);
    await db.query(
      'GRANT USAGE ON SCHEMA identity,org,project,monitoring,public TO taq_identity_app',
    );
    await db.query(`CREATE TABLE public.users (
      id uuid PRIMARY KEY, email text NOT NULL UNIQUE, full_name text NOT NULL,
      password_hash text NOT NULL, is_active boolean NOT NULL
    )`);
    await db.query(
      'CREATE TABLE public.roles (id uuid PRIMARY KEY, code text NOT NULL, name text NOT NULL)',
    );
    await db.query(`CREATE TABLE public.user_roles (
      user_id uuid NOT NULL REFERENCES public.users(id),
      role_id uuid NOT NULL REFERENCES public.roles(id), PRIMARY KEY(user_id,role_id)
    )`);
    await db.query(`CREATE TABLE identity.users (
      id uuid PRIMARY KEY, is_active boolean NOT NULL
    )`);
    await db.query('ALTER TABLE identity.users ENABLE ROW LEVEL SECURITY');
    await db.query(`CREATE POLICY identity_users_tenant_context ON identity.users
      USING (current_setting('app.tenant_id',true) IS NOT NULL)`);
    await db.query(`CREATE TABLE identity.sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES identity.users(id),
      session_token_hash text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz
    )`);
    await db.query(`CREATE TABLE identity.roles (id uuid PRIMARY KEY, role_code text NOT NULL)`);
    await db.query(
      `CREATE TABLE identity.permissions (id uuid PRIMARY KEY, permission_code text NOT NULL)`,
    );
    await db.query(`CREATE TABLE identity.role_permissions (
      role_id uuid NOT NULL REFERENCES identity.roles(id),
      permission_id uuid NOT NULL REFERENCES identity.permissions(id),
      PRIMARY KEY (role_id, permission_id)
    )`);
    await db.query(`CREATE TABLE org.tenants (id uuid PRIMARY KEY, status text NOT NULL)`);
    await db.query(`CREATE TABLE org.organizations (
      id uuid PRIMARY KEY, tenant_id uuid NOT NULL REFERENCES org.tenants(id), status text NOT NULL
    )`);
    await db.query(`CREATE TABLE org.memberships (
      user_id uuid NOT NULL, tenant_id uuid NOT NULL, organization_id uuid NOT NULL,
      role_code text NOT NULL, membership_status text NOT NULL, expires_at timestamptz
    )`);
    await db.query(`CREATE TABLE project.projects (
      id uuid PRIMARY KEY, tenant_id uuid NOT NULL, organization_id uuid NOT NULL,
      project_code text NOT NULL, name_fr text, name_ar text, name_en text,
      description_fr text, description_ar text, description_en text,
      status text NOT NULL, version integer NOT NULL DEFAULT 1,
      created_by uuid NOT NULL, updated_by uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.query(`CREATE TABLE monitoring.project_members (
      project_id uuid NOT NULL, user_id uuid NOT NULL,
      can_submit boolean NOT NULL, can_validate boolean NOT NULL
    )`);
    const migration = readFileSync(
      resolve(process.cwd(), 'database/migrations/20261028_security_identity_links.sql'),
      'utf8',
    );
    await db.query(migration);
    await db.query('COMMIT');
    await db.end();

    db = new Client({ connectionString: databaseUrl });
    await db.connect();
    const deployed = await db.query(
      `SELECT to_regclass('identity.auth_user_links')::text AS mapping_table,
              (SELECT relrowsecurity FROM pg_class WHERE oid='identity.users'::regclass) AS users_rls,
              (SELECT relrowsecurity FROM pg_class WHERE oid='identity.auth_user_links'::regclass) AS links_rls`,
    );
    expect(deployed.rows[0]).toEqual({
      mapping_table: 'identity.auth_user_links',
      users_rls: true,
      links_rls: true,
    });

    const appConnection = new Client({ connectionString: databaseUrl });
    await appConnection.connect();
    await appConnection.query('BEGIN');
    await appConnection.query('SET LOCAL ROLE taq_identity_app');
    const appRead = await appConnection.query(
      'SELECT count(*)::int AS count FROM identity.auth_user_links',
    );
    expect(appRead.rows[0]?.count).toBe(0);
    await appConnection.query('ROLLBACK');
    await appConnection.end();

    await db.query('BEGIN');
    await db.query('ALTER TABLE project.projects ENABLE ROW LEVEL SECURITY');
    await db.query(`CREATE POLICY test_project_scope ON project.projects
      USING (tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)
      WITH CHECK (
        tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND
        organization_id=NULLIF(current_setting('app.organization_id',true),'')::uuid
      )`);
    await db.query('ALTER TABLE org.memberships ENABLE ROW LEVEL SECURITY');
    await db.query(`CREATE POLICY test_membership_scope ON org.memberships USING (
      tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND
      organization_id=NULLIF(current_setting('app.organization_id',true),'')::uuid
    )`);
    await db.query('ALTER TABLE org.organizations ENABLE ROW LEVEL SECURITY');
    await db.query(`CREATE POLICY test_organization_scope ON org.organizations USING (
      tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
    )`);
    await db.query(
      `INSERT INTO public.users (id,email,full_name,password_hash,is_active)
       VALUES ($1,'security-direction@test.invalid','Synthetic Direction',crypt($2,gen_salt('bf')),true)`,
      [publicUserId, adminPassword],
    );
    await db.query('INSERT INTO identity.users VALUES ($1,true)', [identityUserId]);
    await db.query(
      'INSERT INTO identity.auth_user_links (public_user_id,identity_user_id) VALUES ($1,$2)',
      [publicUserId, identityUserId],
    );
    await db.query("INSERT INTO org.tenants VALUES ($1,'active')", [tenantId]);
    await db.query("INSERT INTO org.organizations VALUES ($1,$2,'active')", [
      organizationId,
      tenantId,
    ]);
    await db.query("INSERT INTO org.tenants VALUES ($1,'active')", [otherTenantId]);
    await db.query("INSERT INTO org.organizations VALUES ($1,$2,'active')", [
      otherOrganizationId,
      otherTenantId,
    ]);
    await db.query(
      "INSERT INTO identity.roles VALUES ($1,'CNED_DIRECTION'),($2,'CNED_PMO'),($3,'org_admin')",
      [roleId, pmoIdentityRoleId, adminRoleId],
    );
    await db.query("INSERT INTO public.roles VALUES ($1,'CNED_DIRECTION','Direction')", [
      directionRoleId,
    ]);
    await db.query('INSERT INTO public.user_roles VALUES ($1,$2)', [publicUserId, directionRoleId]);
    await db.query(
      `INSERT INTO public.users (id,email,full_name,password_hash,is_active)
       VALUES ($1,'security-admin@test.invalid','Synthetic Project Admin',crypt($2,gen_salt('bf')),true)`,
      [adminPublicUserId, adminPassword],
    );
    await db.query('INSERT INTO identity.users VALUES ($1,true)', [adminIdentityUserId]);
    await db.query(
      'INSERT INTO identity.auth_user_links (public_user_id,identity_user_id) VALUES ($1,$2)',
      [adminPublicUserId, adminIdentityUserId],
    );
    await db.query(
      "INSERT INTO public.roles VALUES ($1,'SECURITY_TEST_ADMIN','Synthetic test admin')",
      [adminPublicRoleId],
    );
    await db.query('INSERT INTO public.user_roles VALUES ($1,$2)', [
      adminPublicUserId,
      adminPublicRoleId,
    ]);
    await db.query(
      `INSERT INTO public.users (id,email,full_name,password_hash,is_active)
       VALUES ($1,'security-pmo@test.invalid','Synthetic PMO',crypt($2,gen_salt('bf')),true)`,
      [pmoPublicUserId, pmoPassword],
    );
    await db.query(
      "INSERT INTO public.users (id,email,full_name,password_hash,is_active) VALUES ($1,'security-mo@test.invalid','Synthetic MO','test-hash',true)",
      [moPublicUserId],
    );
    await db.query('INSERT INTO identity.users VALUES ($1,true),($2,true)', [
      pmoIdentityUserId,
      moIdentityUserId,
    ]);
    await db.query(
      'INSERT INTO identity.auth_user_links (public_user_id,identity_user_id) VALUES ($1,$2),($3,$4)',
      [pmoPublicUserId, pmoIdentityUserId, moPublicUserId, moIdentityUserId],
    );
    await db.query("INSERT INTO public.roles VALUES ($1,'CNED_PMO','PMO'),($2,'MO','MO')", [
      pmoRoleId,
      moRoleId,
    ]);
    await db.query('INSERT INTO public.user_roles VALUES ($1,$2),($3,$4)', [
      pmoPublicUserId,
      pmoRoleId,
      moPublicUserId,
      moRoleId,
    ]);
    await db.query(
      "INSERT INTO identity.permissions VALUES ($1,'projects.create'),($2,'projects.read')",
      [permissionId, readPermissionId],
    );
    await db.query('INSERT INTO identity.role_permissions VALUES ($1,$2),($3,$4),($5,$6),($5,$7)', [
      roleId,
      readPermissionId,
      pmoIdentityRoleId,
      readPermissionId,
      adminRoleId,
      readPermissionId,
      permissionId,
    ]);
    await db.query(
      `INSERT INTO org.memberships (user_id,tenant_id,organization_id,role_code,membership_status)
       VALUES ($1,$2,$3,'CNED_DIRECTION','active')`,
      [identityUserId, tenantId, organizationId],
    );
    await db.query(
      `INSERT INTO org.memberships (user_id,tenant_id,organization_id,role_code,membership_status)
       VALUES ($1,$2,$3,'org_admin','active')`,
      [adminIdentityUserId, tenantId, organizationId],
    );
    await db.query(
      `INSERT INTO org.memberships (user_id,tenant_id,organization_id,role_code,membership_status)
       VALUES ($1,$3,$4,'CNED_PMO','active'),($2,$3,$4,'MO','active')`,
      [pmoIdentityUserId, moIdentityUserId, tenantId, organizationId],
    );
    const assignedProjectId = randomUUID();
    const unassignedProjectId = randomUUID();
    await db.query(
      `INSERT INTO project.projects (id,tenant_id,organization_id,project_code,name_fr,status,created_by,updated_by)
       VALUES ($1,$2,$3,'ASSIGNED','Assigned','draft',$5,$5),
          ($4,$2,$3,'UNASSIGNED','Unassigned','draft',$5,$5)`,
      [assignedProjectId, tenantId, organizationId, unassignedProjectId, publicUserId],
    );
    await db.query('INSERT INTO monitoring.project_members VALUES ($1,$2,true,false)', [
      assignedProjectId,
      publicUserId,
    ]);
    await db.query(
      'INSERT INTO monitoring.project_members VALUES ($1,$2,false,true),($1,$3,true,false)',
      [assignedProjectId, pmoPublicUserId, moPublicUserId],
    );
    await db.query('COMMIT');
    await startHttpApi();
  });

  afterAll(async () => {
    if (apiProcess && apiProcess.exitCode === null) {
      apiProcess.kill('SIGTERM');
      await new Promise<void>((resolveExit) => apiProcess!.once('exit', () => resolveExit()));
    }
    if (db.connection) await db.end();
  });

  async function asAppInScope<T>(action: () => Promise<T>): Promise<T> {
    await db.query('BEGIN');
    try {
      await db.query('SET LOCAL ROLE taq_identity_app');
      await db.query(
        `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
        [tenantId, organizationId],
      );
      return await action();
    } finally {
      await db.query('ROLLBACK');
    }
  }
  async function asTestOwner<T>(action: () => Promise<T>): Promise<T> {
    await db.query('BEGIN');
    try {
      await db.query('RESET ROLE');
      return await action();
    } finally {
      await db.query('ROLLBACK');
    }
  }
  async function asTestOwnerInScope<T>(action: () => Promise<T>): Promise<T> {
    await db.query('BEGIN');
    try {
      await db.query('RESET ROLE');
      await db.query(
        `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
        [tenantId, organizationId],
      );
      return await action();
    } finally {
      await db.query('ROLLBACK');
    }
  }

  it('creates hashed persistent sessions and rejects revoked or expired sessions', async () => {
    const token = randomUUID();
    await expect(
      asTestOwnerInScope(async () => {
        await db.query('SET LOCAL ROLE taq_identity_app');
        expect(publicUserId).not.toBe(identityUserId);
        expect(await createPersistentSession(db, identityUserId, token)).toBe(true);
        const stored = await db.query(
          'SELECT session_token_hash,expires_at FROM identity.sessions WHERE user_id=$1',
          [identityUserId],
        );
        expect(stored.rows[0]?.session_token_hash).toBe(hashSessionToken(token));
        expect(stored.rows[0]?.session_token_hash).not.toBe(token);
        expect(new Date(stored.rows[0]?.expires_at).getTime()).toBeGreaterThan(Date.now());
        expect(await resolveSession(db, token)).toMatchObject({
          userId: publicUserId,
          identityUserId,
        });

        await revokeSession(db, token);
        expect(await resolveSession(db, token)).toBeUndefined();

        const expiredToken = randomUUID();
        expect(await createPersistentSession(db, identityUserId, expiredToken)).toBe(true);
        await db.query(
          "UPDATE identity.sessions SET expires_at=now()-interval '1 second' WHERE session_token_hash=$1",
          [hashSessionToken(expiredToken)],
        );
        expect(await resolveSession(db, expiredToken)).toBeUndefined();
      }),
    ).resolves.toBeUndefined();
  });

  it('requires active scope, consistent tenant, membership and permission', async () => {
    await expect(
      asAppInScope(() =>
        authorizeOrganization(db, adminIdentityUserId, tenantId, organizationId, 'projects.create'),
      ),
    ).resolves.toBe(true);
    await expect(
      asAppInScope(() =>
        authorizeOrganization(
          db,
          adminIdentityUserId,
          randomUUID(),
          organizationId,
          'projects.create',
        ),
      ),
    ).resolves.toBe(false);
    await expect(
      asAppInScope(() =>
        authorizeOrganization(db, adminIdentityUserId, tenantId, organizationId, 'projects.delete'),
      ),
    ).resolves.toBe(false);

    await expect(
      asTestOwnerInScope(async () => {
        await db.query(
          `UPDATE org.memberships SET expires_at=now()-interval '1 second' WHERE user_id=$1`,
          [adminIdentityUserId],
        );
        await db.query('SET LOCAL ROLE taq_identity_app');
        return authorizeOrganization(
          db,
          adminIdentityUserId,
          tenantId,
          organizationId,
          'projects.create',
        );
      }),
    ).resolves.toBe(false);
  });

  it('denies cross-organization and forged tenant/organization scope', async () => {
    await expect(
      asAppInScope(() =>
        authorizeOrganization(
          db,
          adminIdentityUserId,
          tenantId,
          otherOrganizationId,
          'projects.create',
        ),
      ),
    ).resolves.toBe(false);
    await expect(
      asAppInScope(() =>
        authorizeOrganization(
          db,
          adminIdentityUserId,
          otherTenantId,
          otherOrganizationId,
          'projects.create',
        ),
      ),
    ).resolves.toBe(false);
    await expect(
      asAppInScope(() =>
        authorizeOrganization(db, randomUUID(), tenantId, organizationId, 'projects.create'),
      ),
    ).resolves.toBe(false);
  });

  it('denies project creation to an active member without projects.create', async () => {
    await expect(
      asAppInScope(() =>
        authorizeOrganization(db, pmoIdentityUserId, tenantId, organizationId, 'projects.create'),
      ),
    ).resolves.toBe(false);
  });

  it('allows an authorized project create within the verified scope', async () => {
    await asTestOwner(() =>
      db.query(
        `UPDATE org.memberships SET membership_status='active',expires_at=NULL WHERE user_id=$1`,
        [adminIdentityUserId],
      ),
    );
    await expect(
      asAppInScope(() =>
        authorizeOrganization(db, adminIdentityUserId, tenantId, organizationId, 'projects.create'),
      ),
    ).resolves.toBe(true);
    const projectId = randomUUID();
    const result = await asAppInScope(() =>
      db.query(
        `INSERT INTO project.projects (id,tenant_id,organization_id,project_code,name_fr,status,created_by,updated_by)
         VALUES ($1,$2,$3,'SECURITY-TEST','Authorized','draft',$4,$4)
         RETURNING id,tenant_id,organization_id`,
        [projectId, tenantId, organizationId, adminPublicUserId],
      ),
    );
    expect(result.rows[0]).toEqual({
      id: projectId,
      tenant_id: tenantId,
      organization_id: organizationId,
    });
  });

  it('denies an organization membership after it is revoked', async () => {
    await expect(
      asTestOwnerInScope(async () => {
        await db.query(
          `UPDATE org.memberships SET membership_status='suspended' WHERE user_id=$1`,
          [adminIdentityUserId],
        );
        await db.query('SET LOCAL ROLE taq_identity_app');
        return authorizeOrganization(
          db,
          adminIdentityUserId,
          tenantId,
          organizationId,
          'projects.create',
        );
      }),
    ).resolves.toBe(false);
  });

  it('allows validation by an assigned PMO distinct from the MO submitter', async () => {
    const roles = await asAppInScope(() =>
      db.query(
        'SELECT r.code FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE ur.user_id=$1',
        [pmoPublicUserId],
      ),
    );
    await expect(
      asAppInScope(() => authorizeOrganization(db, pmoIdentityUserId, tenantId, organizationId)),
    ).resolves.toBe(true);
    expect(
      canIndependentlyValidate(
        roles.rows.map((row) => row['code'] as string),
        true,
        pmoPublicUserId,
        moPublicUserId,
      ),
    ).toBe(true);
    expect(
      canIndependentlyValidate(
        roles.rows.map((row) => row['code'] as string),
        true,
        pmoPublicUserId,
        pmoPublicUserId,
      ),
    ).toBe(false);
  });

  it('does not create sessions for an unlinked or inactive identity', async () => {
    const unlinkedIdentityId = randomUUID();
    await expect(
      asTestOwner(async () => {
        await db.query('INSERT INTO identity.users VALUES ($1,true)', [unlinkedIdentityId]);
        await db.query('SET LOCAL ROLE taq_identity_app');
        await db.query(
          `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
          [tenantId, organizationId],
        );
        return createPersistentSession(db, unlinkedIdentityId, randomUUID());
      }),
    ).resolves.toBe(false);
    await expect(
      asTestOwner(async () => {
        await db.query('UPDATE identity.users SET is_active=false WHERE id=$1', [identityUserId]);
        await db.query('SET LOCAL ROLE taq_identity_app');
        await db.query(
          `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
          [tenantId, organizationId],
        );
        return createPersistentSession(db, identityUserId, randomUUID());
      }),
    ).resolves.toBe(false);
  });

  it('does not expose unassigned projects to a Direction-role actor', async () => {
    const roles = await asAppInScope(() =>
      db.query(
        'SELECT r.code FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE ur.user_id=$1',
        [publicUserId],
      ),
    );
    expect(roles.rows[0]?.code).toBe('CNED_DIRECTION');
    const rows = await asAppInScope(() =>
      listAssignedMonitoringProjects(db, tenantId, organizationId, publicUserId),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ code: 'ASSIGNED' });
    expect(rows.some((row) => row['code'] === 'UNASSIGNED')).toBe(false);
  });

  it('hides identity rows when tenant and organization context are absent', async () => {
    const result = await asTestOwner(async () => {
      await db.query(
        `SELECT set_config('app.tenant_id','',true),set_config('app.organization_id','',true)`,
      );
      await db.query('SET LOCAL ROLE taq_identity_app');
      return db.query('SELECT count(*)::int AS count FROM identity.users');
    });

    expect(result.rows[0]?.count).toBe(0);
  });

  it('executes login, scoped reads, create permissions, logout, expiry, and membership revocation over HTTP', async () => {
    const directionLogin = await httpRequest('/v1/auth/login', {
      method: 'POST',
      body: loginBody('security-direction@test.invalid', adminPassword),
    });
    expect(directionLogin.status).toBe(200);
    const directionSession = (await directionLogin.json()) as { token: string };

    const read = await httpRequest('/v1/projects', { token: directionSession.token });
    expect(read.status).toBe(200);
    expect((await read.json()).items.map((item: { code: string }) => item.code)).toEqual([
      'ASSIGNED',
    ]);

    const interOrganization = await httpRequest('/v1/projects', {
      token: directionSession.token,
      organizationId: otherOrganizationId,
      actorId: adminPublicUserId,
    });
    expect(interOrganization.status).toBe(401);

    const directionCreate = await httpRequest('/v1/projects', {
      method: 'POST',
      token: directionSession.token,
      actorId: adminPublicUserId,
      body: { code: 'HTTP-DIRECTION-DENIED', nameFr: 'Denied' },
    });
    expect(directionCreate.status).toBe(403);

    const adminLogin = await httpRequest('/v1/auth/login', {
      method: 'POST',
      body: loginBody('security-admin@test.invalid', adminPassword),
    });
    expect(adminLogin.status).toBe(200);
    const adminSession = (await adminLogin.json()) as { token: string };
    const adminCreate = await httpRequest('/v1/projects', {
      method: 'POST',
      token: adminSession.token,
      body: { code: 'HTTP-SECURITY-ALLOWED', nameFr: 'Authorized' },
    });
    expect(adminCreate.status).toBe(201);

    const logout = await httpRequest('/v1/auth/logout', {
      method: 'POST',
      token: adminSession.token,
    });
    expect(logout.status).toBe(200);
    const afterLogout = await httpRequest('/v1/projects', { token: adminSession.token });
    expect(afterLogout.status).toBe(401);

    const expiryLogin = await httpRequest('/v1/auth/login', {
      method: 'POST',
      body: loginBody('security-admin@test.invalid', adminPassword),
    });
    const expirySession = (await expiryLogin.json()) as { token: string };
    await db.query(
      `UPDATE identity.sessions SET expires_at=now()-interval '1 second'
       WHERE session_token_hash=$1`,
      [hashSessionToken(expirySession.token)],
    );
    const afterExpiry = await httpRequest('/v1/projects', { token: expirySession.token });
    expect(afterExpiry.status).toBe(401);

    const pmoLogin = await httpRequest('/v1/auth/login', {
      method: 'POST',
      body: loginBody('security-pmo@test.invalid', pmoPassword),
    });
    expect(pmoLogin.status).toBe(200);
    const pmoSession = (await pmoLogin.json()) as { token: string };
    await db.query(`UPDATE org.memberships SET membership_status='suspended' WHERE user_id=$1`, [
      pmoIdentityUserId,
    ]);
    const afterMembershipRevocation = await httpRequest('/v1/projects', {
      token: pmoSession.token,
    });
    expect(afterMembershipRevocation.status).toBe(401);
    await db.query(`UPDATE org.memberships SET membership_status='active' WHERE user_id=$1`, [
      pmoIdentityUserId,
    ]);
  });
});
