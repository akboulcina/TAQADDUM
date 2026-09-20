import { describe, expect, it } from 'vitest';
import { auditRoutes } from './audit-routes.js';
import { simulateOutboxPublish } from './outbox-worker.js';
const context = { sub:'u',actor_id:'u',actor_type:'user' as const,tenant_id:'t',organization_id:'o',roles:['org_admin'],permissions:['audit.read'],locale:'fr' as const,session_id:'s',correlation_id:'c',request_id:'r' };
describe('audit platform', () => { it('authorizes audit reads', () => expect(auditRoutes(context,'/v1/audit/records').data).toEqual([])); it('rejects missing permission', () => expect(auditRoutes({...context,permissions:[]},'/v1/audit/records')?.error.status).toBe(403)); it('publishes pending events once', () => { const result=simulateOutboxPublish([{id:'1',event_type:'x',publish_attempts:0},{id:'2',event_type:'y',publish_attempts:1,published_at:'old'}],'now'); expect(result[0].published_at).toBe('now'); expect(result[1].published_at).toBe('old'); }); });
