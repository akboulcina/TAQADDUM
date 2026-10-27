# PROJECT_STATE.md
Last updated: 2026-10-27. Single source of truth.

## Environment and architecture
- Codespaces Linux, Node.js v24.21.0, Python 3, npm; package-lock.json and pnpm-lock.yaml exist.
- PostgreSQL 16.10/PostGIS in Compose, database/user taqaddum, 127.0.0.1:5432 for local backend; postgres hostname only for Docker.
- Node/TypeScript/tsx backend apps/api:3000; React/Vite/TypeScript frontend apps/web:5173. MinIO/worker in Compose not required for this startup.
- Env: DATABASE_URL, NODE_ENV, PGSSLMODE, APP_VERSION, PORT, VITE_API_BASE_URL; request context X-Tenant-Id/X-Organization-Id.
- Keep relative URLs and Vite /v1,/health proxy to 127.0.0.1:3000. Never launch local API and Docker API together.

## Running
Start PostgreSQL with existing Compose from root, wait for pg_isready. If configuration missing inspect checkout. Existing container taqaddum-postgres-1; host psql unavailable, use docker exec. Set local DATABASE_URL and NODE_ENV=local PGSSLMODE=disable APP_VERSION=0.1.0 PORT=3000. npm run dev from apps/api; separate terminal npm run dev -- --host 0.0.0.0 from apps/web. Open forwarded 5173. restart-taqaddum.sh reliability still to verify; never duplicate port 3000 processes.

## Confirmed progress
- Branch feature/import-ready-data; application restored from backup branch.
- User confirmed counts 6 users, 6 roles, 43 KPI records, 22 rule records, 39 conditions. Counts do not validate definitions.
- Login/reference UI cf99aebc; user screenshot confirms login/counts. Demo only.
- User HTTP 200 health/ready database true; projects returns demo 0052 draft. Older fixtures PRJ-2026-0001/0002 not confirmed in current context.
- Health badge can be stale; active counter authorized status differs from workbook definition.
- Migration 20261027_project_monitoring.sql in 6dd1abb: memberships, dated submissions, independent validation, KPI results, alert events; application in Codespace not confirmed.
- Pure engine in 5f20999: AV1 AV2 DL1 DL2 QR1; AL02 AL06 AL13; provisional workbook thresholds; missing values and zero denominators are not_calculable. Seven node:test cases supplied, not run. Test from apps/api: npx tsx --test src/monitoring-engine.test.ts.

## Current backend integration
- monitoring-routes.ts wired into main.ts. Default local DB host now 127.0.0.1; DATABASE_URL still overrides for Docker.
- GET /v1/monitoring/projects lists context-scoped projects. Direction read-only across supplied context, MO/PMO only explicit memberships. Role/account rechecked in DB.
- GET/POST /v1/monitoring/projects/:id/updates for assigned MO/PMO; only MO with can_submit may submit. Date and typed facts validated, future dates forbidden; nonempty comment required.
- POST /v1/monitoring/projects/:id/updates/:updateId/validate requires assigned PMO with can_validate and a different author. Dedicated DB connection/transaction, row lock, rollback, no partial results. Repeated validation returns 409.
- Pilot validation rejects snapshots older than 31 days (technical pilot policy, NOT official CNED threshold). Persists 5 KPI results and triggered supported rules only. Missing booleans do not imply false. Inactive triggered rule blocks validation rather than silently publishing incomplete output.
- GET /v1/monitoring/projects/:id/results returns latest validated snapshot, KPI and incidents. Direction sees AV2, DL2, QR1 and AL02, AL06, AL13 per workbook subset. No raw source/evidence exposed to Direction. MO/PMO see all pilot KPI for assigned projects.
- No automatic memberships or demo seed. Routes correctly deny unassigned MO/PMO. No UI integration yet. No integration or runtime tests run by assistant. Not a claim of deployed working end-to-end workflow.

## Data integrity and remaining delivery
- Original workbook defines 17 rules AL01-AL17; 22 imported records likely include 5 notes. Audit without destructive deletion. Numeric-only prior import lost string thresholds; restore typed conditions. Pilot uses explicit supported formulas, not imported expressions.
- Source facts: consolidated works/costs, consistent elapsed/current/initial days, land required at reference date. Do not average/sum contract durations into project indicator blindly.
- Remaining: membership administration; project form, validation UI, result dashboard; role matrix import for all roles, finance/BET/contractant scopes; full rule audit and formula mapping; date-based refresh, incident acknowledgement/resolution and history pagination.
- Immutable history and formula versioning required. Missing data not zero/green. Distinguish catalog rules from triggered incidents.
- Test authorization, cross-context access, self-validation, stale/future data, rollback, duplicates, threshold boundaries, separate sessions and frontend updates before calling functional.

## Known limitations and precautions
- Existing sessions in memory without expiry; logout does not revoke token. Existing /v1/projects endpoints remain unauthenticated; catalog endpoints not role filtered. Keep demo private, no real data before hardening. New monitoring scope is not a complete account-to-tenant membership model; privileged Direction still selects context via headers.
- Demo passwords disclosed, replace before deployment. Hardcoded provisional engine thresholds may diverge from edited catalog; keep visible and versioned.
- No TRUNCATE, reset, broad git add, forced checkout or deletion of local work. Preserve edits.
- curl --max-time; never paste TypeScript in Bash; standalone heredoc delimiters.
- Tools edit GitHub but cannot run Codespace commands/tests. State code commit vs migration application vs runtime verification separately.
