import { randomUUID } from 'node:crypto';
import type { NormalizedClaims } from '../identity/identity-provider.js';
export interface CommandContext extends NormalizedClaims { request_id: string; }
export function resolveCommandContext(claims: NormalizedClaims): CommandContext { return { ...claims, request_id: randomUUID() }; }
export function transactionSettings(context: CommandContext): Record<string,string> { return {'app.tenant_id': context.tenant_id,'app.organization_id': context.organization_id,'app.actor_id': context.actor_id,'app.correlation_id': context.correlation_id,'app.request_id': context.request_id}; }
