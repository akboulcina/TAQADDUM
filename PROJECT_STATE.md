# PROJECT_STATE.md

Updated: 2026-10-27. Technical source of truth. Master Build Prompt v2 is target,
not evidence of implementation. Owner approved public distribution of ORIGINAL
43-KPI business workbook at 09:59 Africa/Algiers on 2026-10-27. Approval excludes
passwords, tokens, credential spreadsheets and future confidential records.

## Branch, environment and operating model

- Branch feature/import-ready-data. Baseline6f7fcb1; Release0.5 starts96c0bae
  (Vitest port and ADR003/004/005); runtime configuration7c982c7.
- User reported63 commits ahead of main and7/7 original node:test passing;
  neither independently reproduced. No full CI success observed.
- Root engines Node>=22 <23, pnpm9.15.5; CI Node22. Codespaces previously
  Node24.21.0/npm; Node22/pnpm reconciliation pending; both lockfiles exist.
- PostgreSQL16.10/PostGIS Compose, database/user taqaddum, container
  taqaddum-postgres-1; host psql absent. Local API3000/web5173; Vite relative
  /v1,/health proxy127.0.0.1:3000. postgres hostname only for Docker; no duplicate
  local/Docker APIs. MinIO/worker present. restart-taqaddum.sh not verified safe.

## Runtime configuration implemented in source

- API runtime-config requires environment DATABASE_URL (no embedded fallback),
  validates PORT/NODE_ENV and exact CORS_ALLOWED_ORIGINS, parser does not echo secrets.
- API Codespaces origin removed. Default local origins localhost/127.0.0.1:5173,
  empty allowlist allowed; same-origin proxy not rejected for unlisted Origin.
  CORS is neither authorization nor CSRF control.
- Production startup refused until hardening complete. .env.example no credentials,
  blank DATABASE_URL, not automatically loaded. Supply environment privately.
  .gitignore excludes .env variants except .env.example.
- Seven runtime-config Vitest tests supplied, not executed here. Existing exported
  DATABASE_URL still works. No credential rotation/schema/frontend change by7c982c7.
- H3 incomplete: Compose, CI, migrations/scripts and generated workbook may retain
  shared credentials/origins. Runtime default removal is not repository cleanup.

## Current security-check delivery

- scripts/security/scan_credentials.py uses standard Python, git tracked inventory,
  redacted path/location/kind JSON, text heuristics and XLSX/XLSM credential columns.
  Nonzero for findings or incomplete supported-file scans, unsupported paths listed.
- Seven synthetic unit cases executed in assistant Python environment:7 tests,
  zero failures/errors. Cases cover URI redaction, env refs, literal assignments,
  blank values, SQL crypt literals, credential cells and ordinary KPI workbook.
  This is NOT an execution on the repository or Codespace and NOT a green CI claim.
- Added equivalent unittest file and credential-checks.yml (PR, main/work-branch push,
  manual). Read-only token, no extra secrets/dependencies. Intended to fail on
  existing tracked findings; do not waive broad paths for green.
- GitHub targeted secret scan did not run: connector reports Advanced Security
  not enabled. No GitHub subscription/visibility/security settings modified.
- docs/runbooks/credential-remediation.md records limitations and safe remediation.
  This heuristic is NOT a general-purpose or history scan, does not prove safety,
  and does not mutate live accounts or DB. Maintained broad scanner/history audit
  and coordinated live rotation remain pending.
- Owner workbook publication permission does not exempt credential columns in
  generated imports. No actual secret finding count from full repository yet.

## Existing product and evidence to preserve

- User import counts6 users,6 roles,43 KPI,22 rule rows,39 conditions; real workbook
  rules17 AL01-AL17. Extra rows likely notes, textual thresholds lost in numeric-only
  import. UI masks notes without deletion; typed restoration and audit pending.
- Prior commits storage6dd1abb, engine5f20999, backend a7bfdf1, UI85db866,
  visual integration6f7fcb1. User reports MO submission on demo0052. Prior HTTP200
  health/database true and draft0052, other old fixtures not confirmed in context.
- Preserve assigned MO submit, independent PMO validate, row lock/transaction,
  no self-validation, repeat409, immutable dated/versioned snapshots and evidence.
- Pilot5 KPI AV1 AV2 DL1 DL2 QR1;3 rules AL02 AL06 AL13; missing unknown not0/false;
  provisional hardcoded thresholds regression oracle until DB-driven parity.
  Technical freshness31 days not official CNED cadence; DO1-DO3/AL16 gating pending.
- Direction snapshot AV2/DL2/QR1 and3 alert types, no raw source. MO/PMO memberships,
  role hardcoding remains baseline to generalize using matrix without regression.
- Optional exact0052 demo-members script preserves conflicts and separate MO/PMO;
  no independent verification of migration or seed application/e2e here.
- Preserve original UI shell/@taqaddum/ui/demo.css/13-entry sidebar, overview,
  project create/table/catalogs/FR-AR-EN controls; scoped integration CSS and embedded
  MonitoringPanel. No parallel app or fabricated audit/positions. GIS placeholder,
  display polling30sec not daily calculations. Visual runtime not independently tested.

## Architecture and audit findings

- ADR003 Fastify+Zod+pg.Pool target, supersedes NestJS choice; implementation pending.
  ADR004 converge identity/org and reuse identity.sessions. ADR005 node-pg-migrate
  ledger/ordered legacy baseline. No runner or canonical auth migration applied.
- Engine7 tests now Vitest Node environment96c0bae; root Vitest defaults jsdom.
  Run targeted engine/config then full test/lint/format/typecheck/build in checkout.
- PR workflow still glob migrations, only pull_request, Node22/pnpm frozen install,
  audit-platform DB tests then format/lint/types/test/boundaries/Compose/build.
  OpenAPI lint script not explicit CI step; other DB suites not directly invoked.
- Critical fresh install: monitoring SQL alphabetically before required public
  tables, plus duplicate0004 names; no ledger. Do not blindly replay on populated DB.
- Canonical identity.sessions already token hash/expiry/revocation. Historical
  identity.users RLS only tests non-NULL tenant, insufficient isolation. Scoped
  memberships unique per user/context, multi-role convergence/FK inventory pending.
- API still node:http, no Fastify/Nest runtime dependency. Public identity tables
  coexist; per-request monitoring clients and shared legacy client need pooling.
- Stale Perplexity PROJECT_STATE.md attachment dated September must not overwrite
  this branch state. Business source original referential v1 12/10/2026.

## Remaining Release0.5 order and gates

- Full secret inventory, review false positives, remove literals/separate optional
  provisioning, coordinated live rotations with backups and clients. Never delete
  DB volumes; POSTGRES_PASSWORD environment alone does not rotate initialized DB.
- Node22/pnpm reproducibility and verified CI; migration ledger/baseline rehearsal;
  typed/versioned referential+R/S/V,D/I; identity/sessions/scopes and deny-by-default
  business APIs with least-privileged RLS tests; Fastify/contract parity; registry,
  router/query/i18n preserving UI; doctor and reproducible Codespaces runbook.
- R0.5 gate green PR to main, no unauthenticated business APIs, canonical identity
  compatibility verified, typed referential and permission matrices, ledger,
  negative scope tests, no production mock/demo auth. No PR/issue/protection or
  rotation/visibility change performed by connector.
- R1 slices: rights-aware KPI center; DB thresholds/WaveA/golden tests; factual
  PostGIS geolocation editor/MapLibre; cockpit/project360;9 MVP alert lifecycle;
  PMO quality; immutable scoped reports. Synthetic dataset clearly labelled.
- Preserve two delays/uncapped consumption, adjusted/current/delegated AE, consolidated
  works incl terminated/parachèvement, separate advances; active neither completed
  nor received. CO1/CO6 weights flagged off; wilaya list/licence/geo inputs await owner.
  No eval of workbook prose; typed conditions/missing semantics; H6 brief truncated.

## Security and operational boundaries

- In-memory sessions/no expiry/revocation remain; old projects unauthenticated,
  catalogs not role filtered, Direction context no full account-tenant mapping,
  monitoring RLS coverage not demonstrated. Private demo only; no confidential
  data until hardened. Config/scanner do not close those gaps.
- No TRUNCATE/reset/forced checkout/broad git add/deletion of edits or volumes.
  curl --max-time; no TypeScript in Bash; standalone heredoc terminators.
- GitHub connector reads/writes source, not execute Codespace commands. Separate
  source evidence, owner report, synthetic test, commit, applied migration and CI run.
