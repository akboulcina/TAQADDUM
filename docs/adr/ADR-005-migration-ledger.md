# ADR-005 — Ordered migration ledger and legacy baseline

## Status

Accepted runner choice and adoption plan, 2026-10-27. Runner not yet installed
or executed. Rehearsal on empty and existing databases is required.

## Evidence

The PR workflow applies database/migrations/*.sql with shell glob order.
There are two 0004 files. More critically, 20261027_project_monitoring.sql
sorts before 20261027_users_kpis_alerts.sql even though monitoring references
public.users, public.kpis and public.alert_rules created by the latter.
A populated developer database can hide a clean-install failure.

## Decision

Adopt node-pg-migrate with a schema_migrations ledger, timestamped new migration
names, a migration lock and a checked-in ordered legacy manifest. Retain the
original SQL files and their checksums as immutable historical inputs.
Explicit wrappers/manifest must order dependencies, including legacy public
identity/referential tables before monitoring, not rely on filename order.

Bootstrap extensions and schemas are explicit prerequisites. Select transaction
boundaries per migration, document exceptions, and never run an entire directory
of historical SQL blindly against a populated database.

## Existing-database adoption

A dry-run inventories expected tables, columns, constraints, policies, triggers,
indexes, roles, FKs and current checksums. Counts alone are not proof. The runner
must not baseline all files just because one table exists. Require explicit
operator acceptance of a verified baseline report. Report partial application
and schema drift as actionable blockers, not success. Back up before adoption.

Do not rename applied legacy migrations or replay inserts using public demo
credentials. Credential removal uses a reviewed forward path and coordinated
rotation; removing current text cannot erase Git history.

## CI and runbook acceptance

Exercise fresh bootstrap/migration, second run as a no-op, existing-db baseline,
partial-schema rejection, checksum mismatch, concurrency lock and failure rollback.
Only then replace CI shell loops and Codespaces instructions. Apply test fixtures
separately from migrations and synthetic demo seeds behind explicit opt-in.

Document backup/restore, baseline approval, deployment and forward recovery.
No destructive down migration against valuable data; production rollback normally
uses a forward compensating migration or a rehearsed restore. pnpm doctor will
report DB reachability, ledger/schema state and API readiness separately.
