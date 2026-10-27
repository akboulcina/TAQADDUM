# PROJECT_STATE.md

Updated: 2026-10-27. Technical source of truth. Master Build Prompt v2 is target,
not evidence of implementation. Owner approved public ORIGINAL 43-KPI business
workbook at09:59 Africa/Algiers on2026-10-27, not passwords/tokens/credential
spreadsheets or future confidential data. Original business reference v1 12/10/2026.
Stale September project attachment must not overwrite this branch state.

## Branch, environment and configuration

- Branch feature/import-ready-data, baseline6f7fcb1. R0.5 starts96c0bae
  (Vitest+ADR003/004/005), runtime7c982c7, scanner4ef6d47/fix90ba317, CI secret903d157.
- User earlier reported63 ahead of main/original7 node tests; not independently verified.
- Root engines Node>=22 <23/pnpm9.15.5; CI Node22/pnpm9.15.5. Owner switched
  Codespace from24.21.0 to22.23.4, installed pnpm9.15.5, verified frozen install.
  Both npm and pnpm lockfiles remain. Commit2b43114 updates pnpm lock only.
- PostgreSQL16.10/PostGIS, database/user taqaddum, container taqaddum-postgres-1;
  host psql absent. API3000/web5173 local; relative /v1,/health Vite proxy127.0.0.1:3000.
  postgres hostname Docker only; no duplicate local/Docker APIs. MinIO/worker present.
  Restart script not verified safe.
- Runtime requires DATABASE_URL environment without fallback; PORT/NODE_ENV and exact
  CORS_ALLOWED_ORIGINS validated. Codespaces hardcoded origin removed. Defaults
  localhost/127.0.0.1:5173, empty allowlist supported, same-origin proxy preserved.
  CORS neither auth nor CSRF control. Production startup refused pending hardening.
- .env.example blank DATABASE_URL/no credentials/not auto-loaded; other env variants
  ignored. Existing exported DB URL accepted. Seven config Vitest tests supplied,
  not observed executed. No runtime configuration change to DB/schema/frontend.

## Credential inventory and evidence

- Portable standard-Python scanner: tracked working-tree text and XLSX/XLSM
  credential columns; redacted path/location/kind, exit1 findings/exit2 incomplete.
  Unsupported files listed. Heuristic only, not history/general-token guarantee.
- GitHub targeted scanner unavailable because Advanced Security not enabled; no
  subscription/visibility/security setting modified. Maintained scanner/history audit pending.
-4ef6d47 adds7 tests, read-only credential workflow (PR/main/work-branch push/manual),
  docs/runbooks/credential-remediation.md. Owner confirmed7/7 and22 findings across
 8files plus workbook scan-incomplete.
-90ba317 handles empty inlineStr/shared cells, validates indexes, adds Python/CSS/HTML/
  conf/text/XML/dot-config coverage and exception-class-only errors (no messages).
  Owner confirmed10/10 tests and28 findings with no scan errors: original22 plus
 6workbook cells sheet1 C2:C7. Only9 .gitkeep paths unsupported. Findings not unique secrets.
-903d157 replaces3 CI literals with TAQADDUM_CI_DB_PASSWORD; owner reports secret
  created. Expected remaining25 detections not yet confirmed by new full scan.
- No workbook rewritten, passwords rotated or volumes removed. No broad suppressions.
  Source removal separate from real account rotation; POSTGRES_PASSWORD alone does
  not rotate an initialized DB. Public business workbook approval excludes credentials.

## Product and UI baseline to preserve

- User import6users/6roles/43KPI/22rule rows/39conditions; actual business rules17
  AL01-AL17. Excess rows likely notes; numeric-only importer lost textual thresholds.
  UI masks notes without deletion, typed restoration and audit remain pending.
- Storage6dd1abb, engine5f20999, backend a7bfdf1, UI85db866, shell6f7fcb1. Owner
  reported MO submission demo0052. Prior health HTTP200/database true/draft0052;
  other fixtures not confirmed. No independent migration/seed/e2e/browser verification.
- Preserve assigned MO submit, independent PMO validate, no self-validation, atomic
  row-lock transaction, repeat409, immutable dated/versioned snapshots/evidence.
- Pilot AV1 AV2 DL1 DL2 QR1 and AL02 AL06 AL13; missing unknown not0/false, tri-state
  and noncalculable. Hardcoded provisional thresholds regression oracle until DB parity.
  Freshness31days technical not official CNED cadence; DO1-DO3/AL16 confidence gate pending.
- Direction AV2/DL2/QR1 and3 alert types, no raw source. MO/PMO memberships and
  hardcoded roles baseline pending configurable matrix. Optional exact0052 demo
  membership script preserves conflicts and separates MO/PMO.
- Keep @taqaddum/ui original shell/demo.css/13 sidebar entries, overview, project
  create/table/catalogs, FR-AR-EN controls, scoped CSS and embedded MonitoringPanel.
  No replacement app or fabricated audit/positions. GIS placeholder;30sec display
  polling not daily calculation. Visual runtime not independently verified.

## CI, migrations and architecture

- Owner opened PR and reported3 failed checks: two credential invocations and PR
  general checks. Full CI green NOT observed. PR workflow pull_request only, no
  manual button; workflow_dispatch requires default-branch availability.
- First CI failure outdated pnpm lock: API pg ^8.23.1/xlsx ^0.18.5 versus older lock.
  Owner regenerated lock and frozen installation passed; pushed2b43114. Next CI
  reached bootstrap, proving install no longer blocked in that reported run.
- Owner CI log11:01: public.users absent at20261027_project_monitoring.sql. Source
  verified FK dependencies on public.users/kpis/alert_rules created by
 20261027_users_kpis_alerts.sql. Lexicographic glob ran dependent first.
- Current CI-only fix pre-applies users_kpis_alerts immediately before monitoring
  and skips its later glob occurrence. Other SQL files remain in normal glob order.
  No migration files renamed/edited, local DB not touched. Full fresh bootstrap
  still requires observed CI; not a migration ledger or identity convergence fix.
- PR steps: frozen install, bootstrap/migrations/fixtures, audit DB suite, format,
  lint, types, Vitest, boundaries, Compose config/build. Other DB suites not direct
  CI steps; OpenAPI lint script not explicit. Duplicate0004 names and no ledger remain.
  Never blindly replay migrations on populated DB.
- ADR003 target Fastify+Zod+pg.Pool supersedes NestJS; implementation pending.
  ADR004 canonical identity/org reuse identity.sessions. ADR005 node-pg-migrate
  ledger/ordered legacy baseline, runner not installed/applied.
- Engine7 cases ported to Vitest Node environment96c0bae; root jsdom. Need targeted
  engine/config plus full tests/lint/format/typecheck/build evidence.
- Canonical identity.sessions hash/expiry/revocation already exists. Historical
  identity.users RLS only non-NULL tenant, insufficient isolation. Scoped membership
  uniqueness/multi-role convergence/legacy FKs need inventory. Public identity coexists.
  API node:http, no Fastify/Nest runtime dependency; clients need pooling.

## Remaining gates and delivery

- H3 incomplete: remove literals from Makefile/importer/DB tests/Compose/seeds;
  separate optional account provisioning from schema; clean credential workbook
  without business data loss; coordinated live rotations/backups/clients and history audit.
- R0.5: Node22/pnpm reproducibility and verified green PR; ledger/baseline rehearsal;
  typed/versioned referential+R/S/V,D/I; canonical sessions/identity/scopes; deny-by-
  default business APIs and least-privileged RLS negative tests; Fastify/contract
  parity; UI registry/router/query/i18n preserving shell; doctor/Codespace runbook.
  No production demo/mock auth. No PR merge/protection or live rotation by connector.
- R1: rights-aware KPI center, DB thresholds/WaveA/golden tests, factual PostGIS/
  MapLibre editor, cockpit/project360,9 MVP alert lifecycle, PMO quality, immutable
  scoped reports. Synthetic datasets labelled.
- Preserve two delays/uncapped consumption, adjusted/current/delegated AE,
  consolidated works including terminated/parachevement, separate advances; active
  neither completed nor received. Authorized administrative count not active count.
  CO1/CO6 weights flagged off; wilaya/licence/geo await owner. No eval workbook prose;
  typed missing-aware conditions. H6 brief truncated.

## Safety

- In-memory sessions/no expiry/revocation still baseline. Old projects unauthenticated,
  catalogs not role filtered, Direction tenant/account mapping incomplete, monitoring
  RLS unproved. Private demo only; no confidential data until hardening.
- No TRUNCATE/reset/forced checkout/broad git add/deletion of edits or volumes.
  curl --max-time; no TypeScript in Bash; standalone heredoc terminators.
- Connector edits GitHub, not executes Codespace. Separate owner report, source,
  synthetic tests, commit, applied migration and observed CI.
