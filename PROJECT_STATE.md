# PROJECT_STATE.md

Updated: 2026-10-27. Technical source of truth. Master Build Prompt v2 describes
targets, not implemented functionality. Owner explicitly authorized public
publication of the ORIGINAL 43-KPI referential workbook on 2026-10-27 at 09:59
Africa/Algiers. This does not authorize passwords, tokens, user credential
workbooks or future confidential records. Preserve this scoped decision.

## Baseline and environment

- Work branch feature/import-ready-data. Audited baseline 6f7fcb1; first Release
  0.5 commit 96c0baea6a541b2aa1fdc4cf50255f9c31053d9c contains Vitest port and ADRs.
- User reported 63 commits ahead of main and 7/7 original node:test cases passing;
  neither recounted nor rerun by connector. No current CI success verified.
- Root engines >=22 <23, pnpm@9.15.5; CI Node22. Codespaces previously Node24.21.0
  and npm; reconcile to Node22/pnpm pending. Both lockfiles exist.
- PostgreSQL16.10/PostGIS Compose, database/user taqaddum, container
  taqaddum-postgres-1. No host psql; docker exec available. Local API3000, Vite5173.
  Keep Docker PostgreSQL, local hot-reload frontend/backend and relative /v1,/health
  proxy to 127.0.0.1:3000. postgres hostname only for Docker services. Never launch
  duplicate local and Docker APIs. MinIO/worker present but not needed currently.

## Runtime configuration delivery

- runtime-config.ts validates required DATABASE_URL (no embedded fallback), PORT,
  NODE_ENV and exact CORS_ALLOWED_ORIGINS. No credential values printed by parser.
- main.ts consumes parser; removes hardcoded Codespaces origin and API default DB
  password. Default non-production CORS allowlist only localhost/127.0.0.1:5173;
  explicit empty list permits no cross-origin origins. Same-origin proxy requests
  are not rejected for an unlisted Origin. CORS is NOT authorization or CSRF protection.
- NODE_ENV=production explicitly refuses startup until Release0.5 security gates
  are implemented. Other modes remain private-demo only. No bypass flag introduced.
- .env.example has no password, blank DATABASE_URL and documentation. It is not
  auto-loaded: supply DATABASE_URL via shell or Codespaces secret before npm/pnpm
  dev. .gitignore already excludes .env and .env.* except .env.example.
- Existing exported DATABASE_URL continues to work. No database password rotation,
  account reset, schema mutation, route-contract change or frontend change in this lot.
- Seven configuration test cases supplied; not executed. Run from repo root:
  pnpm exec vitest run apps/api/src/runtime-config.test.ts
  apps/api/src/monitoring-engine.test.ts (one command listing both paths).
- Runtime config is only PART of H3. Compose, CI, seed/migration scripts and Excel
  credential copies still contain legacy shared credentials and/or old origins.
  Do not mark secrets removed or rotated. Secret scanning and coordinated rotation
  remain pending. Removing source text does not erase history or rotate a live DB.
- Updating POSTGRES_PASSWORD alone does not rotate an initialized PostgreSQL
  volume; never delete the volume as a shortcut. Back up and coordinate rotation
  with all clients. restart-taqaddum.sh must be audited before calling it safe.

## Preserved functionality and evidence

- Import user-reported counts 6 users,6 roles,43 KPI,22 rule rows,39 conditions;
  17 true AL01-AL17 rules in workbook. Counts not content verification; extra rows
  likely notes. Prior numeric-only import lost textual thresholds; do not delete
  data automatically. Catalog UI masks notes but DB audit still required.
- Storage6dd1abb; engine5f20999; backend a7bfdf1; UI85db866; restored visual shell
  6f7fcb1. User reported MO submission success on demo0052. Prior health/database
  checks HTTP200, project0052 draft. Other fixture projects not confirmed in context.
- Preserve MO submit, separate assigned PMO validation, row lock/transaction,
  no self-validation, repeat409, immutable snapshots/calculationVersion/evidence.
- Pilot AV1 AV2 DL1 DL2 QR1; AL02 AL06 AL13. Missing not zero/false, explicit
  noncalculable and tri-state alerts. Provisional hardcoded thresholds remain as
  regression oracle until DB-driven differential tests pass. Freshness31 days is
  technical policy, not CNED official cadence; DO1-DO3/AL16 gating pending.
- Direction snapshot subset AV2 DL2 QR1 and supported alerts, not raw submissions;
  explicit memberships for MO/PMO. Role checks still hardcoded baseline.
- Optional demo-members seed targets exact0052/id2d5bfd77-c6d7-4f0e-bf5a-de2e1056cf81
  and separate MO/PMO demo accounts, preserves conflicts. No independent seed or
  migration application verification. No connector-run browser/e2e tests.
- Preserve original @taqaddum/ui shell, demo.css,13 navigation entries, overview,
  table/create modal, catalogs, FR/AR/EN controls and scoped integration CSS.
  MonitoringPanel added inside app, not replacement. No fabricated audit events.
  Terrain/GIS placeholder only. Display polling30sec, not daily recomputation.

## Audit and ADRs

- ADR003 accepted target Fastify modular monolith + Zod + pg.Pool, supersedes NestJS
  choice. ADR004 canonical identity/org + existing identity.sessions. ADR005
  node-pg-migrate ledger and explicit legacy baseline. Implementations pending.
- Root Vitest includes *.test.ts/tsx with jsdom default. Engine's seven cases now
  Vitest/expect with @vitest-environment node in96c0bae. No engine semantics change.
- PR workflow pull_request only, Node22/pnpm frozen install, DB bootstrap/migration/
  fixtures glob loops, audit-platform tests, format/lint/typecheck/test/boundaries/
  Compose/build. OpenAPI lint exists as root script, not explicit CI step. Other
  DB suites not explicitly called there. No CI run observed by connector.
- Critical clean-install order: monitoring SQL sorts before prerequisite public
  tables; two0004 migrations; no ledger in current CI loop. Do not replay blindly.
- identity.sessions already has token hash/expiry/revocation; use it. identity.users
  historical RLS checks only non-NULL tenant setting, insufficient authorization.
  org.memberships uniqueness one row per scoped user requires multi-role design;
  canonical identity migration inspected lacks credentials field. Inventory FKs.
- Actual API still node:http; @fastify/cors present but no Fastify/Nest runtime
  dependency. Pool migration and contracts remain to implement.
- Perplexity attachment PROJECT_STATE.md dated September is stale. Do not replace
  this GitHub state with it. Business source original referential v1 12/10/2026.

## Release0.5 next steps and gates

- Finish H3 secret inventory/scanning/seed cleanup and coordinated rotation without
  changing real data or authorizations implicitly. Public-original workbook allowed.
- Node22/pnpm reproducibility and observed tests; ledger/baseline rehearsals;
  typed referential with R/S/V D/I imports; canonical identity/scopes/sessions;
  deny-by-default business APIs and RLS using actual least-privileged runtime role;
  Fastify plugin migration/contract tests; router/query/module registry preserving
  UI; FR/AR parity; doctor and verified runbook. Preserve audit/outbox tests.
- Gate: green PR to main; no unauthenticated business API; canonical identity
  compatibility tested; typed/versioned referential+rights; ledger; scope-negative
  tests; no production mock/demo auth. No PR, protected-main change, visibility
  change or credential rotation performed by connector so far.
- Release1 vertical slices after hardening: rights-aware KPI center; DB-driven
  WaveA/golden tests; PostGIS editor/MapLibre without invented coordinates;
  computed cockpit+project360;9 MVP alert lifecycle rules;PMO data quality;reports.
- Preserve uncapped delay/two durations, adjusted/current/delegated AE, consolidated
  works including terminated/parachèvement, separate advances, active neither
  completed nor received. Authorized UI count is administrative, not active KPI.
- CO1/CO6 flags off until weights validated. Wilaya list/licence and actual geo
  input sources await owner; no hardcoded administrative count. No eval of workbook
  formulas. Typed conditions number/string/boolean/null and missing distinction.
  H6 prompt text truncated; infer acceptance from detailed sections, not missing text.

## Operating precautions

- Existing sessions still in-memory/no expiry/revocation; project APIs unauthenticated,
  catalogs not rights-filtered, Direction context not full account/tenant model;
  monitoring tenant RLS coverage not demonstrated. Private demo only; no real
  confidential data until hardening. Config changes do not solve these gaps.
- No TRUNCATE/reset/forced checkout/broad git add/deletion of local edits or volumes.
  curl --max-time; no TypeScript pasted in Bash; standalone heredoc terminators.
- Connector reads/writes GitHub, not Codespaces commands/tests. Separate source
  inspection, owner reports, pushed commits, applied migrations and runtime proof.
