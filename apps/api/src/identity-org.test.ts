import { describe, expect, it, afterEach } from 'vitest';
import { MockIdentityProvider } from './identity/identity-provider.js';
import { resolveCommandContext, transactionSettings } from './platform/command-context.js';
describe('identity and command context', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });
  it('normalizes mock claims', async () => {
    process.env.NODE_ENV = 'test';
    const claims = await new MockIdentityProvider().resolve({
      headers: { 'accept-language': 'ar' },
    });
    expect(claims.locale).toBe('ar');
    expect(claims.actor_type).toBe('user');
  });
  it('sets transaction-local settings', async () => {
    process.env.NODE_ENV = 'test';
    const claims = await new MockIdentityProvider().resolve({ headers: {} });
    const context = resolveCommandContext(claims);
    expect(transactionSettings(context)['app.tenant_id']).toBeTruthy();
  });
  it('rejects production mock', async () => {
    process.env.NODE_ENV = 'production';
    await expect(new MockIdentityProvider().resolve({ headers: {} })).rejects.toThrow();
  });
});
