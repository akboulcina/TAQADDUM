# PROJECT_STATE.md
Last updated: 2026-10-27. Single source of truth.

## Environment and architecture
- Codespaces Linux, Node.js v24.21.0, Python 3, npm; package-lock.json and pnpm-lock.yaml exist.
- PostgreSQL 16.10/PostGIS in Compose; database/user taqaddum; 127.0.0.1:5432 for local backend, postgres hostname only for Docker.
- Node/TypeScript/tsx apps/api:3000; React/Vite/TypeScript apps/web:5173. MinIO/worker not required for current startup.
- Env DATABASE_URL, NODE_ENV, PGSSLMODE, APP_VERSION, PORT, VITE_API_BASE_URL; context headers X-Tenant-Id/X-Organization-Id. Keep relative URLs and Vite /v1,/health proxy. No duplicate local/Docker APIs.

## Running
Start PostgreSQL using existing root Compose config, wait for pg_isready. If config missing inspect checkout. Existing container taqaddum-postgres-1; use docker exec (host psql unavailable). Set local DATABASE_URL, NODE_ENV=local PGSSLMODE=disable APP_VERSION=0.1.0 PORT=3000; npm run dev from apps/api. Separately npm run dev -- --host 0.0.0.0 from apps/web, open forwarded 5173. restart-taqaddum.sh reliability not confirmed.

## Confirmed evidence
- Branch feature/import-ready-data restored from backup. User confirmed import: 6 users, 6 roles, 43 KPI records, 22 rule records, 39 conditions; counts not definition validation.
- Login/reference UI cf99aebc confirmed by screenshot; user HTTP 200 health ready/database true and project 0052 draft. Earlier PRJ fixtures not confirmed in this context.
- Storage migration 6dd1abb adds monitoring memberships, dated updates, separate validation, KPI results and events. Application in Codespace not confirmed.
- Engine 5f20999 supports AV1, AV2, DL1, DL2, QR1 and AL02, AL06, AL13 with provisional workbook thresholds. Seven node:test cases supplied, not executed by assistant.
- Backend a7bfdf1 wires /v1/monitoring/projects; /projects/:id/updates GET/POST; /updates/:id/validate POST; /projects/:id/results GET. Authenticated active roles rechecked; context/project membership enforced for MO/PMO. Dedicated transaction/row lock; no auto-validation; repeat validation 409. Technical pilot freshness limit 31 days, not official CNED policy.

## Current UI delivery (code only; not runtime verified)
- MonitoringPanel.tsx and revised Demo.tsx connect existing login token to real monitoring routes. Initial tab monitoring; separate project, KPI catalog, rule catalog tabs. Legacy project creation retained. Removed fictitious authorization/audit controls and nonfunctional module labels rather than presenting them as production features.
- MO can select assigned project, submit typed facts/date/comment. PMO can inspect source data and validate another author's situation. Direction sees latest validated subset AV2, DL2, QR1 and three supported alerts; no raw source access. No file attachment upload; comment can reference an external proof.
- Blank numbers/booleans omitted, never coerced to zero/false. Unknown results shown as non calculable. No snapshot means no published result. No alerts does not imply absence of risk.
- Monitoring display refreshes every 30 seconds; server calculations remain frozen at reference date, not daily recomputation. Separate 30-second health refresh fixes one-shot stale badge.
- Catalog UI shows only AL01-AL17; no record deletion. Full catalog APIs still not role filtered. UI primarily French; language/direction switch retained, full translation not implemented.
- Optional database/seed/monitoring-demo-members.sql assigns only exact existing demo project 0052/id 2d5bfd77-c6d7-4f0e-bf5a-de2e1056cf81 in demo tenant/organization to mo@taqaddum.dz (submit) and pmo@taqaddum.dz (validate). Verifies users/roles; on conflict preserves existing permissions. File committed, NOT executed by assistant. No automatic seed or membership admin endpoint.

## Activation and verification
- Pull branch fast-forward only. Apply database/migrations/20261027_project_monitoring.sql with docker exec -i taqaddum-postgres-1 psql -v ON_ERROR_STOP=1 -U taqaddum -d taqaddum, then optional demo membership SQL, only in private demo.
- From apps/api: npx tsx --test src/monitoring-engine.test.ts. Frontend: npx tsc --noEmit -p apps/web/tsconfig.json from root and normal project build if available; no test/build executed by assistant.
- Sign in as MO, submit current-date situation; sign out, PMO reviews/validates; sign out, Direction sees updated validated results. Verify denied access, self-validation, wrong context, rollback and duplicate rejection. Use separate browser sessions for simultaneous views.
- Engine example inputs (same currency/area units): performedValue 30,totalEstimatedCost 100,elapsedDays 360,currentDurationDays 300,initialDurationDays 100,releasedArea 40,requiredArea 100,unblockPlanValidated false,projectCompleted false. Expected AV2 .25, DL2 3, QR1 40 and three candidate triggers. This is synthetic test data, not a real project assessment.

## Data integrity and remaining work
- Original workbook defines 17 actual rules AL01-AL17; 22 imported records likely include 5 note rows. Audit without destructive deletion. Prior numeric-only import lost text thresholds; restore typed conditions. Pilot executes explicit supported formulas, not imported expressions.
- Source facts must be consolidated project works/costs, days in consistent units, land required at reference date. Do not aggregate contract durations blindly. Engine thresholds hardcoded provisional and may differ from edited catalog.
- Remaining membership administration, full R/S/V and D/I matrix import, Finance/BET/contractant workflows, attachments, historical comparisons/pagination, incident resolution, daily evaluation, integration/browser tests. Missing data not zero/green; catalog counts not incident counts.

## Security and precautions
- Sessions in memory without expiry; logout only clears UI token, no server revocation. Existing /v1/projects endpoints unauthenticated, catalog endpoints not role filtered. Direction selects context via headers; no full user-to-tenant authorization model. Private demo only; do not use real confidential data yet. Replace disclosed demo credentials before deployment.
- No TRUNCATE, reset, broad git add, forced checkout or deletion of local edits.
- curl --max-time; no TypeScript pasted in Bash; standalone heredoc delimiters.
- Tools edit GitHub, not execute Codespace commands/tests. Distinguish committed code, applied migration and runtime verified.
