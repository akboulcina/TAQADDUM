# PROJECT_STATE.md
Last updated: 2026-10-27. Single source of truth.

## Environment and architecture
- Codespaces Linux; Node.js v24.21.0; Python 3; npm. Both package-lock.json and pnpm-lock.yaml exist.
- PostgreSQL 16.10/PostGIS in Docker Compose; database/user taqaddum. Local backend connects to 127.0.0.1:5432; postgres hostname reserved for Docker services.
- Backend Node.js/TypeScript/tsx, apps/api, port 3000. Frontend React/Vite/TypeScript, apps/web, port 5173.
- MinIO and worker defined in Compose, not required for current app startup.
- Configuration: DATABASE_URL, NODE_ENV, PGSSLMODE, APP_VERSION, PORT, VITE_API_BASE_URL; context headers X-Tenant-Id and X-Organization-Id.
- Preserve relative frontend URLs and Vite proxies /v1 and /health to http://127.0.0.1:3000. Never run Docker API alongside local API.

## Running
Start PostgreSQL from root with the existing Compose file and wait for pg_isready. If Compose configuration is missing, investigate checkout rather than assuming wrong directory. Existing container: taqaddum-postgres-1. Host psql unavailable; docker exec can query container.
Set local DATABASE_URL, NODE_ENV=local, PGSSLMODE=disable, APP_VERSION=0.1.0, PORT=3000. Run npm run dev in apps/api. In another terminal run npm run dev -- --host 0.0.0.0 in apps/web. Open forwarded port 5173. restart-taqaddum.sh exists; reliability remains to verify. Do not launch duplicate backend processes.

## Confirmed progress
- Branch feature/import-ready-data; application restored from local backup branch.
- User confirmed import counts: 6 users, 6 roles, 43 KPI records, 22 alert-rule records, 39 conditions. Counts do not validate rule integrity.
- Login/reference pages delivered in cf99aebc0f776777bb2d81c06547d5d6a44abd0b; screenshot confirms login and counts. Not production ready.
- User curl HTTP 200 on /health/ready (database true) and /v1/projects (one demo project 0052, draft). Earlier fixture names PRJ-2026-0001/0002 not confirmed in this context.
- Health badge can remain stale. Active counter uses authorized status, not yet aligned with workbook business definition.
- Storage migration 20261027_project_monitoring.sql committed in 6dd1abb; application in Codespace NOT confirmed. Adds memberships, dated updates, separate validation, KPI results and alert events. No deletion.

## Current calculation delivery
- Added monitoring-engine.ts and monitoring-engine.test.ts. Pure core only, NOT wired into routes, storage or UI.
- Supports AV1, AV2, DL1, DL2, QR1 and candidate rule evaluations AL02, AL06, AL13, based on workbook formulas. Thresholds provisional.
- Source facts use consolidated project costs and required land at reference date; elapsed/current/initial durations all use days. Do not add or average contract durations to infer project aggregates.
- Missing facts and zero denominators yield not_calculable; unknown alert evaluations use null, never false reassurance. Input validation rejects unknown fields, strings, negatives and non-finite values.
- Candidate triggers are NOT publishable incidents until validated/fresh data and permissions are checked. Date-based refresh not implemented.
- Seven node:test cases supplied; not executed by assistant. From apps/api: npx tsx --test src/monitoring-engine.test.ts.
- Workbook source lists actual rules AL01–AL17. Previous count 22 likely includes five note rows; audit required before execution. Do not delete user data automatically. Prior numeric-only condition import lost text thresholds; restore typed conditions from original workbook.

## Next integration and acceptance
- Complete a vertical slice: assigned operator submits dated source facts; separate authorized validator validates; atomic calculation stores results and genuine alert events; Direction consults history.
- Enforce project membership, tenant/organization and workbook R/S/V, D/I permissions on server. Import/verify matrix. Membership flags alone are not authorization.
- Preserve validated snapshots; version formulas; add scheduled recalculation for time-dependent KPI. Use dedicated DB transaction connections, not shared-client interleaved transactions.
- Distinguish rule catalog count from incident count. Do not claim 43 executable KPI or all imported conditions supported.
- Test role access denied/allowed, validation, rollback, thresholds, missing data, duplicates and dashboard updates. Route/form integration still pending.

## Known limitations and precautions
- Existing sessions in memory without expiry; UI logout does not revoke token. Project endpoints still not protected. Keep demo private and do not load real data before hardening.
- Disclosed demo passwords must be replaced before deployment.
- No TRUNCATE, reset, broad git add, forced checkout or deletion of local work. Preserve uncommitted files.
- curl must have --max-time. Do not paste TypeScript into Bash; heredoc terminators standalone.
- Tools edit GitHub, not run Codespace commands/tests. Distinguish committed code, applied migration and verified runtime.
