# PROJECT_STATE.md
Last updated: 2026-10-27. Single source of truth.

## Environment and architecture
- GitHub Codespaces Linux; Node.js v24.21.0; Python 3; npm. package-lock.json and pnpm-lock.yaml exist.
- PostgreSQL 16.10/PostGIS in Docker Compose; database/user taqaddum; local backend connects to 127.0.0.1:5432. Hostname postgres is only for Docker services.
- Backend Node.js/TypeScript/tsx: apps/api, port 3000. Frontend React/Vite/TypeScript: apps/web, port 5173.
- MinIO and worker defined in Compose; not needed for current frontend/backend startup.
- Configuration: DATABASE_URL, NODE_ENV, PGSSLMODE, APP_VERSION, PORT, VITE_API_BASE_URL; request context X-Tenant-Id and X-Organization-Id.
- Preserve relative frontend URLs and Vite proxies /v1 and /health to http://127.0.0.1:3000. Do not run Docker API and local API simultaneously.

## Running
From repository root, use existing Docker Compose configuration to start PostgreSQL and wait for pg_isready. If configuration is missing, investigate the checkout; do not assume wrong working directory. Existing running container is taqaddum-postgres-1. Host psql is unavailable; docker exec can query that container.
Set DATABASE_URL to the local PostgreSQL connection, NODE_ENV=local, PGSSLMODE=disable, APP_VERSION=0.1.0, PORT=3000. Run npm run dev from apps/api. In a separate terminal run npm run dev -- --host 0.0.0.0 from apps/web. Open forwarded port 5173. Never launch a second backend on port 3000. restart-taqaddum.sh exists in the restored application branch; startup reliability remains to verify.

## Confirmed progress and evidence
- Working branch: feature/import-ready-data. Application restored from local backup branch.
- User-reported successful import: 6 users, 6 roles, 43 KPI definitions, 22 alert-rule records, 39 conditions. Counts do not establish rule correctness.
- Login and reference lists delivered in commit cf99aebc0f776777bb2d81c06547d5d6a44abd0b. User screenshot confirms login and reference counts. Not production-ready.
- User curl checks return HTTP 200 for /health/ready (database true) and /v1/projects. Current demo tenant returned one project 0052, status draft. Earlier fixture notes mentioned PRJ-2026-0001/0002; do not assume they are present in this context.
- Frontend health badge can remain stale after an initial failed check. Active count currently uses authorized status; business definition needs alignment with workbook.

## Current delivery: storage foundation, not functional monitoring UI
- Added database/migrations/20261027_project_monitoring.sql. Migration NOT executed by the assistant.
- Adds monitoring project memberships, dated submissions, validator metadata, versioned KPI results and alert events. No existing data deleted.
- No source fields, formulas, submission routes or screens integrated by this delivery.

## Implementation direction and acceptance criteria
- Deliver a vertical slice: assigned operator submits dated project facts; separate authorized validator validates; backend calculates supported KPI and evaluates supported alert rules; Direction sees dated results, evidence and history.
- Enforce project membership, tenant/organization scope, and workbook R/S/V and D/I permissions on server. Membership flags alone are not implemented authorization.
- Validate typed source fields before storage. Missing data is not zero or green. Preserve nonnumeric alert conditions rather than silently converting them to NULL.
- Import and verify workbook role matrix before claiming role-specific dashboards.
- Recalculation uses validated snapshots and versioned formulas; add calendar-based evaluation for time-dependent indicators.
- Distinguish reference-rule count from triggered incident count. No claim that all 43 KPI or all imported conditions are executable.
- Test allowed/denied access, validation, zero denominators, missing values, threshold boundaries, duplicate evaluation, and decision dashboard updates.

## Known limitations and precautions
- Current bearer sessions are in memory without expiry; frontend logout does not revoke server token. Existing project endpoints are not yet protected by these sessions. Do not expose demo publicly or use real data before authorization hardening.
- Demo credentials were disclosed; keep local/test only and replace before deployment.
- No TRUNCATE, reset, broad git add, forced checkout, or deletion of local work for future updates. Preserve uncommitted work.
- Use curl --max-time. Do not paste TypeScript into Bash. Heredoc terminators must be standalone.
- Current tools can edit GitHub but do not execute commands or tests in the user's Codespace. Report commits, migration application and runtime testing separately.
