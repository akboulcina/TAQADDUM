import type { CommandContext } from './platform/command-context.js';
import type { AuditRepository } from './audit-repository.js';
export async function auditRoutes(
  context: CommandContext,
  url: string,
  repository: AuditRepository,
) {
  const parsed = new URL(url, 'http://localhost');
  if (parsed.pathname !== '/v1/audit/records') return null;
  if (!context.permissions.includes('audit.read'))
    return {
      status: 403,
      body: {
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'audit.read is required',
      },
    };
  const filters = Object.fromEntries(
    [
      'tenant_id',
      'organization_id',
      'target_context',
      'target_aggregate_type',
      'target_aggregate_id',
      'action_code',
      'from',
      'to',
      'cursor',
      'limit',
    ].map((key) => [key, parsed.searchParams.get(key) ?? undefined]),
  );
  if (filters['tenant_id'] && filters['tenant_id'] !== context.tenant_id)
    return {
      status: 403,
      body: { type: 'about:blank', title: 'Forbidden', status: 403, detail: 'tenant scope denied' },
    };
  const result = await repository.list(context, filters);
  return {
    status: 200,
    body: {
      data: result.records,
      page: {
        limit: Math.min(Number(filters['limit'] ?? 25), 100),
        next_cursor: result.nextCursor,
        has_more: result.hasMore,
      },
    },
  };
}
