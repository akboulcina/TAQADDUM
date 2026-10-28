import { createHash } from 'node:crypto';

export type SecurityDb = {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};

export type SessionActor = {
  userId: string;
  identityUserId: string;
  email: string;
  fullName: string;
};

export function extractBearerToken(
  headers: Record<string, string | undefined>,
): string | undefined {
  const authorization = headers['authorization'] ?? '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : undefined;
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export async function createPersistentSession(
  db: SecurityDb,
  identityUserId: string,
  token: string,
): Promise<boolean> {
  const result = await db.query(
    `INSERT INTO identity.sessions (user_id,session_token_hash,expires_at)
     SELECT i.id,$2,now() + interval '8 hours'
     FROM identity.users i
     JOIN identity.auth_user_links l ON l.identity_user_id=i.id
     WHERE i.id=$1 AND i.is_active=true
     RETURNING id`,
    [identityUserId, hashSessionToken(token)],
  );
  return result.rows.length === 1;
}

export async function resolveSession(
  db: SecurityDb,
  token: string,
): Promise<SessionActor | undefined> {
  if (!token) return undefined;
  const result = await db.query(
    `SELECT p.id AS user_id,i.id AS identity_user_id,p.email,p.full_name
     FROM identity.sessions s
     JOIN identity.users i ON i.id=s.user_id
     JOIN identity.auth_user_links l ON l.identity_user_id=i.id
     JOIN public.users p ON p.id=l.public_user_id
     WHERE s.session_token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()
       AND i.is_active=true AND p.is_active=true`,
    [hashSessionToken(token)],
  );
  const row = result.rows[0];
  if (!row) return undefined;
  return {
    userId: String(row['user_id']),
    identityUserId: String(row['identity_user_id']),
    email: String(row['email']),
    fullName: String(row['full_name']),
  };
}

export async function revokeSession(db: SecurityDb, token: string): Promise<void> {
  if (!token) return;
  await db.query(
    `UPDATE identity.sessions SET revoked_at=now()
     WHERE session_token_hash=$1 AND revoked_at IS NULL`,
    [hashSessionToken(token)],
  );
}

export async function authorizeOrganization(
  db: SecurityDb,
  identityUserId: string,
  tenantId: string,
  organizationId: string,
  permission?: string,
): Promise<boolean> {
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1
       FROM org.memberships m
       JOIN org.tenants t ON t.id=m.tenant_id AND t.status='active'
       JOIN org.organizations o ON o.id=m.organization_id
         AND o.tenant_id=m.tenant_id AND o.status='active'
       WHERE m.user_id=$1 AND m.tenant_id=$2 AND m.organization_id=$3
         AND m.membership_status='active'
         AND (m.expires_at IS NULL OR m.expires_at>now())
         AND ($4::text IS NULL OR EXISTS (
           SELECT 1
           FROM identity.roles r
           JOIN identity.role_permissions rp ON rp.role_id=r.id
           JOIN identity.permissions p ON p.id=rp.permission_id
           WHERE r.role_code=m.role_code AND p.permission_code=$4
         ))
     ) AS allowed`,
    [identityUserId, tenantId, organizationId, permission ?? null],
  );
  return result.rows[0]?.['allowed'] === true;
}
