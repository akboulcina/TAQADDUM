import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { authenticateWorkspace, parseWorkspaceContexts } from './pmo-auth-context.js';
import { hashSessionToken, type SecurityDb } from './security-auth.js';

const context = () => ({
  tenantId: randomUUID(),
  tenantCode: 'test',
  tenantName: 'Test tenant',
  organizationId: randomUUID(),
  organizationCode: 'test',
  organizationName: 'Test organization',
  roleCode: 'MO',
  roleName: 'Test role',
  permissions: ['projects.read'],
});
const account = () => ({
  public_user_id: randomUUID(),
  identity_user_id: randomUUID(),
  email: 'workspace@example.test',
  full_name: 'Synthetic test identity',
  contexts: [context()],
});
const dbFor = (rows: Record<string, unknown>[]): SecurityDb => ({
  async query() {
    return { rows };
  },
});

describe('PMO workspace authentication contract', () => {
  it('rejects missing or empty contexts', () => {
    for (const value of [undefined, null, {}, []])
      assert.equal(parseWorkspaceContexts(value), undefined);
  });
  it('rejects malformed IDs and non-string permissions', () => {
    assert.equal(parseWorkspaceContexts([{ ...context(), tenantId: 'invalid' }]), undefined);
    assert.equal(parseWorkspaceContexts([{ ...context(), permissions: [true] }]), undefined);
  });
  it('rejects duplicate scope identities instead of silently merging roles', () => {
    const value = context();
    assert.equal(parseWorkspaceContexts([value, value]), undefined);
  });
  it('keeps permissions separate for different organizations', () => {
    const first = context();
    const second = { ...context(), permissions: ['projects.create'] };
    const parsed = parseWorkspaceContexts([first, second])!;
    assert.deepEqual(parsed[0]!.permissions, ['projects.read']);
    assert.deepEqual(parsed[1]!.permissions, ['projects.create']);
  });
  it('allows memberships with no business permission without inventing rights', () => {
    assert.deepEqual(
      parseWorkspaceContexts([{ ...context(), permissions: [] }])![0]!.permissions,
      [],
    );
  });
  it('preserves explicitly distinct canonical and public user IDs', async () => {
    const row = account();
    const result = await authenticateWorkspace(dbFor([row]), row.email, randomUUID(), randomUUID());
    assert.equal(result!.userId, row.public_user_id);
    assert.equal(result!.identityUserId, row.identity_user_id);
    assert.notEqual(result!.userId, result!.identityUserId);
  });
  it('uses parameterized credentials and passes only the token hash to SQL', async () => {
    const row = account();
    const secretInput = randomUUID();
    const token = randomUUID();
    const db: SecurityDb = {
      async query(text, values) {
        assert.match(text, /authenticate_workspace_user\(\$1,\$2,\$3\)/);
        assert.deepEqual(values, [row.email, secretInput, hashSessionToken(token)]);
        assert.equal(text.includes(secretInput), false);
        assert.equal(values!.includes(token), false);
        return { rows: [row] };
      },
    };
    await authenticateWorkspace(db, '  WORKSPACE@example.test  ', secretInput, token);
  });
  it('rejects absent and ambiguous authentication results', async () => {
    const row = account();
    assert.equal(
      await authenticateWorkspace(dbFor([]), row.email, randomUUID(), randomUUID()),
      undefined,
    );
    assert.equal(
      await authenticateWorkspace(dbFor([row, row]), row.email, randomUUID(), randomUUID()),
      undefined,
    );
  });
  it('rejects malformed account identities and scope payloads', async () => {
    const row = account();
    for (const broken of [{ ...row, identity_user_id: '' }, { ...row, contexts: [] }])
      assert.equal(
        await authenticateWorkspace(dbFor([broken]), row.email, randomUUID(), randomUUID()),
        undefined,
      );
  });
  it('does not query the database with empty login inputs', async () => {
    let calls = 0;
    const db: SecurityDb = {
      async query() {
        calls += 1;
        return { rows: [] };
      },
    };
    await authenticateWorkspace(db, '', randomUUID(), randomUUID());
    await authenticateWorkspace(db, 'workspace@example.test', '', randomUUID());
    await authenticateWorkspace(db, 'workspace@example.test', randomUUID(), '');
    assert.equal(calls, 0);
  });
});
