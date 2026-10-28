import { describe, expect, it } from 'vitest';
import {
  authorizeOrganization,
  extractBearerToken,
  hashSessionToken,
  resolveSession,
  revokeSession,
} from './security-auth.js';

const token = 'session-token-for-test-only';

describe('persistent security sessions', () => {
  it('ignores client-supplied actor identity headers', () => {
    expect(
      extractBearerToken({
        authorization: `Bearer ${token}`,
        'x-actor-id': 'forged-public-user-id',
      }),
    ).toBe(token);
    expect(extractBearerToken({ 'x-actor-id': 'forged-public-user-id' })).toBeUndefined();
  });

  it('resolves an explicit cross-schema identity link without equating IDs', async () => {
    let queryText = '';
    let queryValues: unknown[] = [];
    const db = {
      async query(text: string, values: unknown[] = []) {
        queryText = text;
        queryValues = values;
        return {
          rows: [
            {
              user_id: 'public-user-id',
              identity_user_id: 'identity-user-id',
              email: 'person@example.test',
              full_name: 'Test Person',
            },
          ],
        };
      },
    };

    const actor = await resolveSession(db, token);

    expect(actor).toEqual({
      userId: 'public-user-id',
      identityUserId: 'identity-user-id',
      email: 'person@example.test',
      fullName: 'Test Person',
    });
    expect(queryText).toContain('identity.auth_user_links');
    expect(queryText).toContain('s.revoked_at IS NULL');
    expect(queryText).toContain('s.expires_at>now()');
    expect(queryText).toContain('p.is_active=true');
    expect(queryValues[0]).toBe(hashSessionToken(token));
  });

  it('requires active organization membership and the requested permission', async () => {
    let queryText = '';
    let queryValues: unknown[] = [];
    const db = {
      async query(text: string, values: unknown[] = []) {
        queryText = text;
        queryValues = values;
        return { rows: [{ allowed: true }] };
      },
    };

    await expect(
      authorizeOrganization(
        db,
        'identity-user-id',
        'tenant-id',
        'organization-id',
        'projects.create',
      ),
    ).resolves.toBe(true);
    expect(queryText).toContain('org.memberships');
    expect(queryText).toContain('identity.role_permissions');
    expect(queryValues).toEqual([
      'identity-user-id',
      'tenant-id',
      'organization-id',
      'projects.create',
    ]);
  });

  it('denies access when the membership or permission query has no grant', async () => {
    const db = {
      async query() {
        return { rows: [{ allowed: false }] };
      },
    };

    await expect(
      authorizeOrganization(
        db,
        'identity-user-id',
        'tenant-id',
        'organization-id',
        'projects.create',
      ),
    ).resolves.toBe(false);
  });

  it('revokes only the hash of the presented bearer token', async () => {
    let queryText = '';
    let queryValues: unknown[] = [];
    const db = {
      async query(text: string, values: unknown[] = []) {
        queryText = text;
        queryValues = values;
        return { rows: [] };
      },
    };

    await revokeSession(db, token);

    expect(queryText).toContain('SET revoked_at=now()');
    expect(queryText).toContain('revoked_at IS NULL');
    expect(queryValues).toEqual([hashSessionToken(token)]);
  });
});
