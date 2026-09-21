import { randomUUID } from 'node:crypto';
export type ActorType = 'user' | 'service';
export interface NormalizedClaims {
  sub: string;
  actor_id: string;
  actor_type: ActorType;
  tenant_id: string;
  organization_id: string;
  roles: string[];
  permissions: string[];
  locale: 'fr' | 'ar' | 'en';
  session_id: string;
  correlation_id: string;
}
export interface IdentityProvider {
  resolve(request: { headers: Record<string, unknown> }): Promise<NormalizedClaims>;
}
export class MockIdentityProvider implements IdentityProvider {
  async resolve(request: { headers: Record<string, unknown> }): Promise<NormalizedClaims> {
    if (!['local', 'test'].includes(process.env['NODE_ENV'] ?? ''))
      throw new Error('Mock identity provider is disabled outside local/test');
    const tenantId = String(request.headers['x-tenant-id'] ?? 'demo-tenant');
    const organizationId = String(request.headers['x-organization-id'] ?? 'demo-org');
    const actorId = String(request.headers['x-actor-id'] ?? 'admin@example.test');
    const locale = String(request.headers['accept-language'] ?? 'fr')
      .split(',')[0]
      ?.slice(0, 2) as 'fr' | 'ar' | 'en';
    return {
      sub: actorId,
      actor_id: actorId,
      actor_type: 'user',
      tenant_id: tenantId,
      organization_id: organizationId,
      roles: ['org_admin'],
      permissions: ['projects.read', 'projects.create'],
      locale: ['fr', 'ar', 'en'].includes(locale) ? locale : 'fr',
      session_id: 'mock-session',
      correlation_id: String(request.headers['x-correlation-id'] ?? randomUUID()),
    };
  }
}
