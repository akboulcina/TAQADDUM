# PROJECT_STATE.md
Last updated: 2026-10-27. Single source of truth.

## Environment and architecture
- Codespaces Linux; Node.js v24.21.0; Python 3; npm; package-lock.json and pnpm-lock.yaml exist.
- PostgreSQL 16.10/PostGIS in Compose; database/user taqaddum; local backend at 127.0.0.1:5432. postgres hostname only inside Docker.
- Node/TypeScript/tsx apps/api:3000; React/Vite/TypeScript apps/web:5173. MinIO/worker not required for current startup.
- Env DATABASE_URL, NODE_ENV, PGSSLMODE, APP_VERSION, PORT, VITE_API_BASE_URL; context X-Tenant-Id/X-Organization-Id. Preserve relative frontend URLs and Vite /v1,/health proxy. Never duplicate APIs on 3000.

## Running
Start PostgreSQL with existing root Compose config; wait for pg_isready. If config missing inspect checkout. Existing container taqaddum-postgres-1; use docker exec (no host psql). Set local DATABASE_URL, NODE_ENV=local PGSSLMODE=disable APP_VERSION=0.1.0 PORT=3000. npm run dev in apps/api; separate terminal npm run dev -- --host 0.0.0.0 in apps/web, open forwarded 5173. restart-taqaddum.sh reliability not confirmed.

## Confirmed evidence
- Branch feature/import-ready-data restored from local backup.
- User confirmed import counts: 6 users, 6 roles, 43 KPI records, 22 rule records, 39 conditions. Counts not validation of content.
- Login/reference UI cf99aebc screenshot confirmed; user HTTP 200 health ready/database true and project 0052 draft. Earlier fixtures PRJ-2026-0001/0002 not confirmed in this context.
- Monitoring storage migration 6dd1abb; engine 5f20999 (AV1 AV2 DL1 DL2 QR1; AL02 AL06 AL13, provisional thresholds); backend a7bfdf1; first UI 85db866.
- User reported successful situation submission. User said test was fine, but PMO validation and Direction values have not been independently verified by assistant.
- Seven engine node:test cases supplied; not run by assistant. Migration application, seed application, builds and browser workflow not independently tested.

## Monitoring workflow retained
- Authenticated /v1/monitoring/projects lists context projects; explicit memberships required for MO/PMO, Direction read-only in selected context. Active roles rechecked from DB.
- /projects/:id/updates GET/POST: assigned MO can submit dated typed facts/comment. /updates/:id/validate POST requires assigned separate PMO, transaction and row lock, repeated validation 409. Technical freshness policy 31 days, not an official CNED threshold.
- /projects/:id/results GET returns latest validated subset. Direction AV2,DL2,QR1 and three supported alert types; no raw source/evidence. MO/PMO can view source submissions.
- Missing facts not zero/false; noncalculable explicit; empty incidents not proof of safety. Calculations frozen at snapshot date; display refresh 30 seconds, not daily recalculation.
- Optional database/seed/monitoring-demo-members.sql targets only exact demo 0052/id 2d5bfd77-c6d7-4f0e-bf5a-de2e1056cf81 in demo tenant/organization, mo@taqaddum.dz submit and pmo@taqaddum.dz validate; preserves existing assignments. Committed script not executed by assistant.

## Current visual integration
- User explicitly requests integration into old project, not a replacement pilot interface. Historical Demo.tsx read from cf99aebc; old demo.css still present and unchanged.
- Demo.tsx restores original shell, @taqaddum/ui components, full original navigation, overview cards, searchable/filterable project table, creation modal, language/direction controls; adds MonitoringPanel as an additional module and Centre de contrôle entry. Initial page overview again.
- New monitoring-integration.css is additive and scoped to .monitoring-module; styles native inputs/buttons without changing demo.css, database, engine or backend.
- Overview counts projects, administrative authorized projects, KPI definitions and reference rules, not fake incidents/audit. Original mock authorization is not restored as a database operation. No fabricated audit events.
- KPI and alert catalogs remain separate from computed monitoring results. Only AL01-AL17 shown, note rows hidden without deletion.
- Terrain et GIS navigation restored with honest demo/placeholder. Historical page had only its navigation label, no actual map. Other original demo/coming-soon navigation entries retained as explicitly not connected. Do not claim restoration of a functional GIS or invent positions.
- Existing monitoring form retains source-data review, PMO validation, latest results and polling. Project-table link opens monitoring module; selected monitoring project still chosen within that module.
- Files committed do not establish runtime/build success. No new migration needed for visual integration. Existing monitoring migration/assignments remain required if not applied.

## Verification
- git pull --ff-only origin feature/import-ready-data on current branch; preserve local edits if refused.
- From apps/api: npx tsx --test src/monitoring-engine.test.ts. Normal frontend build/typecheck with project tooling; assistant cannot execute these in Codespace.
- Check restored shell vs old screenshot, responsive inputs, all navigation labels, overview/catalog vs genuine incident distinction, MO submission/PMO validation/Direction result refresh.
- Synthetic pilot example: performedValue30,totalEstimatedCost100,elapsedDays360,currentDurationDays300,initialDurationDays100,releasedArea40,requiredArea100,unblockPlanValidated false,projectCompleted false. Expected AV2 .25,DL2 3,QR1 40 and three supported triggers. Not real project evidence.

## Remaining work and integrity
- Source workbook has 17 actual rules AL01-AL17; 22 imported records likely include notes. Audit without deletion. Prior numeric import lost textual thresholds; typed restoration required. Engine uses explicit formulas not imported expressions.
- Consolidated project costs/works, consistent duration days and required land at reference date; no blind contract-duration aggregation. Hardcoded provisional thresholds may diverge from edited catalog.
- Remaining full role matrix/R-S-V/D-I, membership administration, Finance/BET/contractant inputs, actual GIS, evidence upload, history comparisons/pagination, incident closure, daily evaluation, integration/browser tests, full translation.

## Security and precautions
- Private demo only: sessions in memory without expiry, UI logout not server revocation, old /v1/projects unauthenticated, catalog APIs not role filtered, Direction context selected via headers without full account-to-tenant authorization. Do not use confidential real data. Replace disclosed demo passwords before deployment.
- No TRUNCATE, reset, broad git add, forced checkout or deletion of local work. curl --max-time; no TypeScript in Bash; standalone heredoc delimiters.
- Tools edit GitHub, not run Codespace commands. Report commits, applied migrations and runtime verification separately.
