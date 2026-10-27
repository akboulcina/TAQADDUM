# Database bootstrap runbook

## Local prerequisites

Use Docker Compose PostgreSQL/PostGIS and a local synthetic database URL. No production credentials belong in this repository.

## Apply

```bash
make up
make migrate
make seed
make db-check
```

Migrations are forward-only SQL files under `database/migrations/`. Add an ordered file, document the owner/schema, constraints, indexes, lock/duration impact, validation query, and compensating migration plan. Never edit an applied migration.

## Ownership and privileges

```bash
psql "$DATABASE_URL" -f database/verification/check-ownership.sql
```

Runtime roles are schema-scoped and receive no DDL. Verify app roles cannot create objects and cannot read other module schemas.

## Restore local database

Stop the stack, remove the local PostgreSQL volume only when disposable local data may be lost, start the stack again, then run `make migrate` and `make seed`. Production restore requires PITR/backup procedures, incident approval, audit evidence, and reconciliation.
