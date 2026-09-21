import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { MockIdentityProvider } from './identity/identity-provider.js';
import { resolveCommandContext } from './platform/command-context.js';
import { identityOrgRoutes } from './identity-org-routes.js';
import { auditRoutes } from './audit-routes.js';
import { PostgresAuditRepository } from './audit-repository.js';
const port = Number(process.env.PORT ?? 3000);
const provider = new MockIdentityProvider();
const repository = new PostgresAuditRepository(async (text, values) => {
  if (!process.env.DATABASE_URL) return { rows: [] };
  const { Client } = await import('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return { rows: (await client.query(text, values)).rows };
  } finally {
    await client.end();
  }
});
const server = createServer(async (req, res) => {
  const headers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(req.headers)) headers[key] = value;
  const requestId = randomUUID();
  try {
    const claims = await provider.resolve({ headers });
    const context = resolveCommandContext(claims);
    if (req.method === 'GET') {
      const audit = await auditRoutes(
        context,
        req.url?.split('?')[0] ? (req.url ?? '/') : '/',
        repository,
      );
      if (audit) {
        res.writeHead(audit.status, {
          'content-type': audit.status === 200 ? 'application/json' : 'application/problem+json',
          'x-request-id': requestId,
        });
        res.end(JSON.stringify(audit.body));
        return;
      }
      const result = identityOrgRoutes(context, req.url?.split('?')[0] ?? '/');
      if (result) {
        res.writeHead(200, { 'content-type': 'application/json', 'x-request-id': requestId });
        res.end(JSON.stringify(result));
        return;
      }
    }
    res.writeHead(404, { 'content-type': 'application/problem+json', 'x-request-id': requestId });
    res.end(
      JSON.stringify({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'Route not found',
      }),
    );
  } catch (error) {
    res.writeHead(401, { 'content-type': 'application/problem+json', 'x-request-id': requestId });
    res.end(
      JSON.stringify({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: error instanceof Error ? error.message : 'Unauthorized',
      }),
    );
  }
});
server.listen(port, () =>
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'api',
      environment: process.env.NODE_ENV ?? 'local',
      operation: 'startup',
      outcome: 'success',
      port,
    }),
  ),
);
