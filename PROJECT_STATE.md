# PROJECT_STATE.md

Updated: 2026-10-27. Technical source of truth. Master Build Prompt v2 is target,
not proof of implemented functionality. Owner approved public ORIGINAL 43-KPI
business workbook on 2026-10-27 at09:59 Africa/Algiers; not credentials/tokens,
user-password workbooks or future confidential records. No data-publication waiver
for passwords. Original business workbook v1 12/10/2026 remains business reference.

## Branch, runtime and architecture baseline

- Branch feature/import-ready-data. Baseline6f7fcb1; R0.5 commits96c0bae
  (Vitest+ADR003/004/005),7c982c7(runtime configuration),4ef6d47(scanner/CI/runbook).
- User reported63 ahead of main and original7/7 node:test. No full CI verified.
- Root Node>=22 <23/pnpm9.15.5, CI Node22; Codespaces previously Node24.21.0/npm.
  Reconciliation to Node22/pnpm pending, both lockfiles remain.
- PostgreSQL16.10/PostGIS Compose, taqaddum DB/user, taqaddum-postgres-1 container;
  host psql absent, use docker exec. API3000/web5173 local hot reload. Preserve
  relative /v1,/health Vite proxy127.0.0.1:3000. postgres hostname Docker only.
  Never duplicate local/Docker APIs. MinIO/worker exist. Restart script not audited.
- API runtime-config requires DATABASE_URL environment, validates PORT/NODE_ENV,
  exact CORS_ALLOWED_ORIGINS. No embedded API DB fallback or fixed Codespaces origin.
  Default local5173 origins; empty list supported; proxy same-origin not rejected.
  CORS not auth/CSRF. Production startup blocked until hardening. .env.example has
  blank DB URL, no secret, not auto-loaded. .env variants ignored except example.
- Seven config Vitest tests supplied, not run here. Existing exported DB URL still
  accepted. No credential rotation, schema, data or UI mutation in configuration lot.

## Credential audit: observed and reported evidence

- GitHub scanner unavailable: connector reported Advanced Security not enabled.
  No subscription/security/visibility changes performed. Portable standard-Python
  scanner is a limited heuristic, not history/general-token audit or safety proof.
-4ef6d47 added tracked-text/OOXML credential-column scanner,7 unittest cases,
  read-only GitHub workflow PR/push main+work branch/manual, remediation runbook.
- User's Codespace output on 2026-10-27 at10:15 confirms fast-forward to4ef6d47
  and7/7 scanner tests passing. Full scan reported22 occurrences across8 files:
  pr.yml3, Makefile6, importer1, user/KPI SQL6, DB test scripts3, Compose3.
  Occurrences are not unique secret counts or validated exploitability.
- Same report: import-ready.xlsx scan-incomplete, and .py/.css/.html/.conf plus
  dot-config files excluded from coverage. No claim of a complete clean scan.
- Current fix handles empty inlineStr cells with no is node and empty shared-string
  cells; validates nonempty shared indexes. Reproduced synthetic empty-cell bug,
  but exact cause in user's workbook is NOT established until rerun.
- Coverage now includes Python, CSS, HTML, conf, txt, csv, XML, gitignore/editorconfig;
  placeholder .gitkeep and unsupported formats remain listed, not certified safe.
- Error reports add exception class only (error_type), no exception message/value.
  Ten synthetic regression cases passed in assistant Python environment; no full
  corrected repo scan or workflow execution observed. Scanner source/tests self-check
  had no findings in that environment. This is not application Vitest/CI success.
- No credential removed, password rotated, volume deleted or Excel rewritten by
  scanner fix. Keep detection exit1 and incomplete exit2. False positives require
  review, never broad suppressions. Runbook docs/runbooks/credential-remediation.md.

## Product baseline preserved

- User import counts6 users/6roles/43KPI/22rule rows/39conditions; actual source
  rules17 AL01-AL17. Notes likely excess, text thresholds lost by numeric importer.
  UI masks notes, DB audit/typed repair pending, no destructive cleanup.
- Storage6dd1abb, engine5f20999, backend a7bfdf1, UI85db866, restored shell6f7fcb1.
  User reported MO submission on demo0052, prior HTTP200 health/database and draft0052.
  Old PRJ fixtures not confirmed in context; no independent browser/e2e here.
- Preserve MO assigned submit, independent PMO assigned validation, no self-validation,
  locked atomic transaction, repeat409, immutable dated/versioned snapshots/evidence.
- Pilot AV1 AV2 DL1 DL2 QR1 and AL02 AL06 AL13. Missing not0/false, tri-state alerts,
  explicit noncalculable. Hardcoded provisional thresholds kept as regression oracle
  until DB-configured differential parity.31-day freshness technical, not official
  CNED; DO1-DO3/AL16 confidence gate pending. Empty incident list not safety proof.
- Direction validated subset AV2 DL2 QR1 and3 supported alert types, no raw source.
  MO/PMO memberships; hardcoded role checks baseline pending configurable rights.
- Optional exact0052 membership script separate demoMO/PMO, preserves conflicts;
  no independent migration/seed application verification. Preserve existing authors.
- Keep original @taqaddum/ui shell/demo.css/13 navigation entries, overview,
  project table/create modal/catalogs/FR-AR-EN selector, scoped integration CSS,
  embedded MonitoringPanel; no replacement pilot app, fake audit or coordinates.
  GIS remains placeholder. Poll display30sec, not daily calculation refresh.

## ADRs, audit and unresolved risks

- ADR003 target Fastify+Zod+pg.Pool supersedes NestJS, pending implementation.
  ADR004 canonical identity/org using existing identity.sessions. ADR005
  node-pg-migrate ledger/legacy baseline, runner not installed/applied.
- Engine7 cases ported to Vitest Node environment96c0bae; root jsdom default.
  Need observed targeted/full Vitest, format/lint/typecheck/build results.
- Existing PR CI glob SQL, pull_request only, Node22/pnpm frozen install,
  audit-platform DB test then format/lint/types/test/boundaries/Compose/build.
  OpenAPI lint root script not explicit step; other DB suites not directly called.
- Fresh-install blocker: monitoring alphabetically before public dependencies,
  duplicate0004 names, no ledger. Do not blindly replay on current database.
- identity.sessions already hash/expiry/revocation. Historical identity.users RLS
  only checks non-NULL tenant, not membership. Scoped-membership uniqueness/multiple
  business roles and legacy FK mapping must be reviewed before convergence.
- API still node:http; no Fastify/Nest runtime dependency, shared legacy client and
  per-request monitoring clients pending pg.Pool. Public identity coexists with canonical.
- Stale September PROJECT_STATE.md attached in Perplexity must not overwrite GitHub.

## Release0.5 and later delivery

- H3 still incomplete: remove literals from Compose/CI/Makefile/scripts/seeds,
  separate schema from account provisioning, clean generated credential workbook
  without business-data loss, coordinate real password rotations with backups and
  clients. Environment POSTGRES_PASSWORD alone cannot rotate initialized DB;
  never remove volume. History audit/maintained scanner remain needed.
- Node22/pnpm reproducibility; ledger/baseline rehearsal; typed/versioned referential
  with R/S/V,D/I matrices; canonical sessions/identity/scopes and least-privilege
  RLS negative tests; authenticated business APIs; Fastify/contract parity; frontend
  registry/router/query/i18n preserving appearance; doctor and verified runbook.
- R0.5 done only with green PR to main, canonical identity compatibility, typed rights,
  ledger, scope denial tests and no production demo/mock auth. No PR/issue/protection,
  credential rotation or visibility change performed by connector.
- R1: rights-aware KPI center, DB thresholds/WaveA/golden tests, factual PostGIS
  editor/MapLibre, cockpit/project360,9MVP alert workflow, PMO quality and reports.
  Synthetic demo labelled. Preserve uncapped/two delays, adjusted/current/delegated
  AE, consolidated terminated/parachèvement works, separate advances, active neither
  completed nor received. Authorized count is administrative not active definition.
- CO1/CO6 weights flagged off; wilaya list/licence and actual geo await owner. No eval
  of workbook prose; conditions typed and missing-aware. H6 brief truncated.

## Operational safety

- In-memory/no-expiry/nonrevoked sessions remain; old projects unauthenticated,
  catalogs not role filtered; Direction not full account/tenant authorization,
  monitoring tenant RLS not demonstrated. Private demo only, no confidential data.
- No TRUNCATE/reset/forced checkout/broad git add/deletion of edits or volumes.
  curl --max-time; no TypeScript in Bash; standalone heredoc delimiters.
- Connector edits GitHub, not runs Codespace. Distinguish source evidence, user
  report, synthetic test result, commit, applied migration and observed CI.
