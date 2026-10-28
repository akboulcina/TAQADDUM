import { hashSessionToken, type SecurityDb, type SessionActor } from './security-auth.js';

export type WorkspaceContext = {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  roleCode: string;
  roleName: string;
  permissions: string[];
};

export type WorkspaceAccount = SessionActor & { contexts: WorkspaceContext[] };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const textFields = [
  'tenantId', 'tenantCode', 'tenantName', 'organizationId',
  'organizationCode', 'organizationName', 'roleCode', 'roleName',
] as const;

export function parseWorkspaceContexts(input: unknown): WorkspaceContext[] | undefined {
  if (!Array.isArray(input) || input.length === 0) return undefined;
  const contexts: WorkspaceContext[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return undefined;
    const value = item as Record<string, unknown>;
    if (textFields.some((field) => typeof value[field] !== 'string')) return undefined;
    if (!uuid.test(value['tenantId'] as string) || !uuid.test(value['organizationId'] as string))
      return undefined;
    if (!(value['roleCode'] as string).trim()) return undefined;
    const permissions = value['permissions'];
    if (!Array.isArray(permissions) || permissions.some((p) => typeof p !== 'string' || !p.trim()))
      return undefined;
    const context: WorkspaceContext = {
      tenantId: value['tenantId'] as string,
      tenantCode: value['tenantCode'] as string,
      tenantName: value['tenantName'] as string,
      organizationId: value['organizationId'] as string,
      organizationCode: value['organizationCode'] as string,
      organizationName: value['organizationName'] as string,
      roleCode: value['roleCode'] as string,
      roleName: value['roleName'] as string,
      permissions: [...new Set(permissions as string[])],
    };
    const key = `${context.tenantId}:${context.organizationId}:${context.roleCode}`;
    if (seen.has(key)) return undefined;
    seen.add(key);
    contexts.push(context);
  }
  return contexts;
}

export async function authenticateWorkspace(
  db: SecurityDb,
  email: string,
  password: string,
  token: string,
): Promise<WorkspaceAccount | undefined> {
  if (!email.trim() || !password || !token) return undefined;
  const result = await db.query(
    `SELECT public_user_id,identity_user_id,email,full_name,contexts
     FROM identity.authenticate_workspace_user($1,$2,$3)`,
    [email.trim().toLowerCase(), password, hashSessionToken(token)],
  );
  if (result.rows.length !== 1) return undefined;
  const row = result.rows[0]!;
  const contexts = parseWorkspaceContexts(row['contexts']);
  if (!contexts || typeof row['public_user_id'] !== 'string'
      || typeof row['identity_user_id'] !== 'string'
      || !uuid.test(row['public_user_id']) || !uuid.test(row['identity_user_id'])
      || typeof row['email'] !== 'string' || typeof row['full_name'] !== 'string')
    return undefined;
  return {
    userId: row['public_user_id'],
    identityUserId: row['identity_user_id'],
    email: row['email'],
    fullName: row['full_name'],
    contexts,
  };
}
