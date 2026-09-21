import { describe, expect, it } from 'vitest';
import { auditRoutes } from './audit-routes.js';
import { PostgresAuditRepository } from './audit-repository.js';
import { simulateOutboxPublish } from './outbox-worker.js';
const context = {
  sub: 'u',
  actor_id: 'u',
  actor_type: 'user' as const,
  tenant_id: 't',
  organization_id: 'o',
  roles: ['org_admin'],
  permissions: ['audit.read'],
  locale: 'fr' as const,
  session_id: 's',
  correlation_id: 'c',
  request_id: 'r',
};
describe('audit platform', () => {
  it('filters tenant and organization through parameterized SQL', async () => {
    let sql = '';
    const repo = new PostgresAuditRepository(async (text, values) => {
      sql = text;
      expect(values[0]).toBe('t');
      expect(text).toContain('tenant_id = $1');
      return { rows: [] };
    });
    const result = await auditRoutes(
      context,
      '/v1/audit/records?tenant_id=t&organization_id=o&limit=25',
      repo,
    );
    expect(result?.status).toBe(200);
    expect(sql).toContain('organization_id = $2');
  });
  it('rejects other tenant', async () => {
    const repo = new PostgresAuditRepository(async () => ({ rows: [] }));
    const result = await auditRoutes(context, '/v1/audit/records?tenant_id=other', repo);
    expect(result?.status).toBe(403);
  });
  it('rejects missing permission', async () => {
    const repo = new PostgresAuditRepository(async () => ({ rows: [] }));
    const result = await auditRoutes({ ...context, permissions: [] }, '/v1/audit/records', repo);
    expect(result?.status).toBe(403);
  });
  it('publishes pending events once', () => {
    const result = simulateOutboxPublish(
      [
        { id: '1', event_type: 'x', publish_attempts: 0 },
        { id: '2', event_type: 'y', publish_attempts: 1, published_at: 'old' },
      ],
      'now',
    );
    const first = result[0];
    const second = result[1];

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first?.published_at).toBe('now');
    expect(second?.published_at).toBe('old');
  });
});
