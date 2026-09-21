# Project lifecycle minimal

## Lifecycle

A project starts in `draft`.

Allowed transitions:

- `draft` → `authorized`
- `authorized` → `archived`

A project cannot be authorized without:

- a non-empty name in French, Arabic, or English;
- `authorized_at`;
- `authorized_by`.

## Tenant context

Every request that reads or changes projects must set the tenant context inside its transaction:

```sql
SET LOCAL app.tenant_id = '<tenant-uuid>';
```

The context must not be supplied by a client-controlled project payload.

## Minimal verification

Run:

```bash
git diff --check
test -s database/migrations/0004_project.sql
test -s database/test-fixtures/003_projects.sql
test -s docs/runbooks/project-lifecycle-minimal.md
```

This milestone does not include phases, batches, contracts, finance, or planning entities.
