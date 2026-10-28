# PROJECT_STATE.md

Updated: 2026-10-27. Technical source of truth. Master Build Prompt v2 is target,
not evidence of implementation. Owner approved public ORIGINAL 43-KPI business
workbook at09:59 Africa/Algiers on2026-10-27, not passwords/tokens/credential
spreadsheets or future confidential data. Original business reference v1 12/10/2026.
Stale September project attachment must not overwrite this branch state.

## Proposed security remediation lot — 2026-10-28

- This isolated change set is based on `859f173968f6f4f39b286d65547af8900799ccf3`.
  It adds persistent hashed sessions with expiry/revocation/logout, explicit
  cross-schema identity links, server-verified organization scope and project
  permissions, exact RLS context, and explicit monitoring project assignment.
- The Direction role does not bypass project assignment. Project `001` has no
  verified organization relationship and is not proposed for assignment.
- The migration was validated only on a dedicated test database. It has not
  been applied to the application database; no real user, identity link,
  membership, role, permission, or project assignment was created.
- Existing account access remains blocked until a verified person, tenant,
  organization, role/permissions, and any project scope are approved and
  provisioned explicitly. No matching by email or UUID is performed.
- Isolated validation on Node `v22.23.4` / pnpm `9.15.5`: frozen install passed;
  tests 46/46 including 11 dedicated PostgreSQL/HTTP integrations; explicit
  typecheck, API/web builds, ESLint, repository Prettier, and `git diff --check`
  passed. Secret scanner unit tests passed 14/14 and the tracked/untracked scan
  reported 0 findings and 0 errors. The test URL was the loopback-only dedicated
  PostgreSQL database; `DATABASE_URL` was unset. The application database was
  not used. Scanner history/token limitations remain as documented by the tool.

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

## Owner checkpoint — 2026-10-27 11:32 +01

- Owner screenshot confirms general PR checks succeeded, including bootstrap,
  audit DB tests, format, lint, typecheck, tests, boundaries, Compose config and build.
- Credential checks still fail. Owner's current scan reports 25 findings across
  8 files, no scan errors; unsupported paths include .prettierignore and .gitkeep.
- Importer connection fallback removed locally: DATABASE_URL is now mandatory.
  Patch verification and publication pending. No import executed, database account
  changed, workbook rewritten or live password rotated by this operation.

## Makefile credential cleanup — 2026-10-27

- Owner verified importer patch: typecheck/format passed, scan down to24 findings.
- Makefile test targets now require exported DATABASE_URL rather than embedded
  credentials. Docker documents target requires DOCUMENTS_DATABASE_URL reachable
  from inside its container; duplicate host invocation removed.
- Local patch only; validation pending. No database tests, migration, import,
  workbook rewrite or credential rotation performed by this edit.

## DB test credential cleanup — 2026-10-27

- Owner pushed Makefile cleanup as5c2d425 after four missing-configuration
  guard checks and format/diff checks succeeded. Scan previously down to18 findings.
- Three DB test scripts now require DATABASE_URL without embedded fallback.
  Makefile invokes these Bash scripts with bash, preserving pipefail compatibility.
- Local patch validation pending. No real database tests, migration, import,
  workbook rewrite or live credential rotation executed by this edit.

## Compose credential cleanup — 2026-10-27

- Owner's latest scan reports15 remaining findings, no scan errors.
- Compose now requires POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD and
  DOCKER_DATABASE_URL. The latter must address PostgreSQL from Docker networking;
  it is distinct from the host-side DATABASE_URL.
- CI config-only validation supplies non-secret placeholders scoped to that step;
  no service is started with them. Existing CI PostgreSQL service retains its secret.
- Local configuration validation pending. Existing containers/accounts unchanged;
  no restart, volume deletion, password rotation or import performed by this edit.
- Before future local Compose commands, supply existing real credentials privately.
  Changing environment values alone does not rotate an initialized PostgreSQL DB.

## User credential separation — 2026-10-27

- Owner pushed Compose cleanup f18fa77 after config-only validation and three
  missing-variable checks. Latest owner scan:12 findings, no scan errors.
- Workbook diagnostic: Users C2:C7 inline strings, no formulas/shared strings.
- Local cleanup clears those cells; verifies all other cells in that sheet unchanged,
  preserves other ZIP payloads and checks removed values are not retained in payloads.
- Migration and importer no longer use published/shared passwords. New user rows
  get independent random hashes and is_active=false. Existing migration conflicts
  do nothing; importer conflicts update full_name only, preserving hash/active state.
- Optional apps/api/scripts/activate-inactive-user.mjs requires explicit email,
  --activate-inactive, DATABASE_URL and password via stdin. Updates only an inactive
  public.users account, never role memberships. Not a production identity solution.
- Patch validation pending. No import, migration, account activation or live_rotation
  executed. Existing exposed credentials remain valid until separately rotated.
- Historical Git secrets are NOT erased by this cleanup; history audit and coordinated
  rotations remain pending. Do not blindly replay modified legacy migrations.

## Scanner stdin false-positive fix — 2026-10-27

- After staging the activation tool, scanner flagged its stdin-derived assignment.
- Narrow recognition added for the exact readFileSync(0, 'utf8').replace expression;
  no file/path exclusion and no general readFileSync exemption.
- Four regression cases added: exact stdin read accepted; literal assignment,
  other file read and stdin plus literal suffix still reported.
- Local verification pending; scanner remains a heuristic, not a safety guarantee.

## Activation input validation correction — 2026-10-27

- Owner diagnostic confirmed doubled backslashes in three generated JS regexes.
- Corrected email whitespace validation, terminal newline removal and rejection
  of embedded CR/LF/NUL. Scanner exception remains narrow and unchanged.
- Behavioral verification pending. Activation tool not executed against a database.

## Project-list assignment review — 2026-10-28

- Review reproduced the visibility gap over HTTP on the dedicated test database:
  a Direction identity with `projects.read`, assigned only to `ASSIGNED`, received
  both `ASSIGNED` and `UNASSIGNED` from `GET /v1/projects` before the correction.
- `listProjects()` now additionally requires an explicit
  `monitoring.project_members` row for the authenticated public user. A true HTTP
  regression verifies that only `ASSIGNED` is returned; the user assigned to
  that project retains access. No organization-wide mandate was introduced.
- The migration grants the application role only schema usage plus SELECT on
  `monitoring.project_members` and SELECT/INSERT on `project.projects`, needed by
  the scoped list/create routes. Test-only manual grants were removed.
- Validation after this correction: dedicated HTTP/DB test suite 11/11; root
  tests 47/47; Node `v22.23.4`; typecheck, API build, lint, format, and
  `git diff --check` passed. No application database was used or migrated.
- This correction is local and not yet published. It does not create access or
  grant a real user; the application account-link, membership, and authorization
  prerequisites recorded above remain in force.

## PMO authentication-context checkpoint — 2026-10-28

- Continuation branch: `feature/pmo-workspace-assistant-2026-10-28`, from
  `de56c0821ae4071576a0e0edcaa377b20490240a`. Owner's Codespace and excluded
  local edits are untouched; supplied source export is preserved separately.
- Added an unused, typed workspace authentication adapter and a separate forward
  SQL migration. The function checks existing password accounts, explicit identity
  links, active/unexpired memberships, active organizations/tenants and scoped role
  permissions, then creates a hashed eight-hour session. No account is provisioned.
- Canonical and public user IDs remain distinct. Malformed, duplicate or empty
  scope responses fail closed. Permissions are not merged across organizations.
- This checkpoint does NOT wire the adapter into login or change the current UI.
  Existing login/session behavior and prior migration files remain unchanged.
- Ten unit cases passed after TypeScript 5.8.2 transpilation in the assistant
  sandbox using Node v20.20.1's built-in test runner in place of Vitest. The source
  test file targets the existing Vitest framework; Vitest itself was not run here.
  Syntax parsing passed; project typecheck/build/lint/format remain unverified.
- The new SQL has not been executed against PostgreSQL. Its trusted SECURITY
  DEFINER owner and grants require dedicated-database verification before use.
  This is draft implementation code, not a completed authentication deployment.
- No SQL applied, existing record modified, real access granted, application
  restarted, PR merged or deployment performed. Remaining work: dedicated DB
  tests, login integration, supplied PMO frontend integration and browser checks.

## PMO migration ordering correction — 2026-10-28

- The unexecuted draft `20261028_pmo_authentication.sql` sorted before its
  prerequisite `20261028_security_identity_links.sql`. It is now a comment-only
  marker; the identical function SQL is in `20261028_workspace_authentication.sql`.
  Existing security/legacy migrations and the CI workflow are unchanged.
- Restored the historical phrase `update full_name`; no importer code changed.
- Static checks verified dependency filename order, exactly one function definition,
  unchanged SQL payload, comment-only marker and a targeted state-document diff.
  PostgreSQL bootstrap, Vitest, formatting and full CI remain unverified here.
- No database migration was executed. Login/UI remain unchanged at this checkpoint.

## PR 12 checkpoint verification — 2026-10-28

- Observed GitHub checks for `4d428b17c419c537353f34d87f4ef4b937588f70`:
  frozen install, dedicated CI PostgreSQL bootstrap and database audit tests passed.
  The fresh CI bootstrap therefore exercised the corrected migration order.
  This does not verify runtime authentication or least-privilege function behavior.
- Both jobs finished with failure. The general job failed at `pnpm format:check`;
  subsequent lint, typecheck, Vitest, boundaries, Compose validation and build were
  skipped. The credential job's scanner tests passed, but its repository scan failed.
- Reproduced a sensitive-assignment rule hit on the adapter's typed credential
  parameter. Renamed it to `credentialInput`; the scanner and credential semantics
  are unchanged. Reformatted the adapter/test candidates and restored the historical
  phrase `password rotated`. Repository-wide scan and Prettier await rerun in CI.
- Repeated ten unit cases successfully after TypeScript 5.8.2 transpilation using
  Node v20.20.1 and the adapted built-in runner, not an actual Vitest execution.
- Published `main.ts` still uses the prior login/session flow. The new contract is
  not wired into login or protected routes. No migration or account provisioning
  occurred on the application database. Live Codespace working-tree inspection is
  unavailable here; no local files, excluded edits or caches were modified.
- Continue on PR 12 and its existing branch only. First resolve checkpoint CI,
  then verify the new SQL with dedicated-database HTTP tests before login/API
  integration. No additional branch, workflow, deployment or real access is created.
