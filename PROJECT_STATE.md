# PROJECT_STATE.md

Updated: 2026-10-27. Technical source of truth. Business source: original
TAQADDUM 43-KPI workbook (v1, 12/10/2026); public distribution not approved yet.
Master Build Prompt v2 is the target brief, not evidence of implemented features.

## Baseline and preserved environment

- Work branch feature/import-ready-data; audited baseline HEAD
  6f7fcb15341324105ec6d78173f27a347f34f464, confirmed by GitHub get_commit.
- User reports branch 63 commits ahead of main and 7/7 node:test cases passing;
  ahead count and test execution were not independently reproduced here.
- Codespaces previously used Node 24.21.0; inspected root engines is >=22 <23,
  packageManager pnpm@9.15.5, CI Node 22. Target Node 22 across CI/Codespaces,
  pnpm sole package manager; environment reconciliation pending. Both lockfiles exist.
- PostgreSQL 16.10/PostGIS in Compose, database/user taqaddum, container
  taqaddum-postgres-1; host psql unavailable. API local 3000, React/Vite web 5173.
  MinIO and worker exist; no framework or port replacement in this delivery.
- DATABASE_URL required for eventual hardened deployment. Historical local
  connection defaults and exposed demo passwords require coordinated removal
  and rotation; do not copy them into new code or docs.
- Preserve local backend/frontend, Docker PostgreSQL, relative /v1 and /health
  and Vite proxy to 127.0.0.1:3000. Docker hostname postgres only in Docker.
  No parallel local/Docker API. restart-taqaddum.sh remains unverified.

## Existing business pipeline and UI

- User confirmed prior import counts: 6 users, 6 roles, 43 KPI records,
  22 rule rows, 39 conditions. Workbook has 17 actual rules AL01-AL17;
  note rows likely explain excess. Do not equate count with integrity.
- Commits: storage 6dd1abb; engine 5f20999; backend a7bfdf1; initial pilot UI
  85db866; restored original dashboard shell plus monitoring integration 6f7fcb1.
- User reported successful MO submission on project 0052. Earlier user HTTP
  checks returned health/database ready and project 0052 draft. Earlier PRJ
  fixtures not confirmed in that context. No independent browser/e2e run here.
- Preserve assigned MO submission, separate PMO validation, row lock and
  transaction, repeat validation 409, immutable dated snapshots/version/evidence.
  Pilot computes AV1 AV2 DL1 DL2 QR1; AL02 AL06 AL13. Missing is unknown, not 0
  or false; empty alerts not proof of safety; provisional hardcoded thresholds
  remain until database-driven differential tests pass.
- Technical 31-day pilot freshness is not official CNED policy. Extend into
  DO1-DO3 confidence gating and AL16 without silently changing frozen history.
- Monitoring results visible to Direction: AV2 DL2 QR1 and three supported
  alert types, not raw sources. Existing MO/PMO hardcoded role checks are baseline
  behavior to test before permission-matrix generalization.
- Optional demo-members SQL targets exact existing project 0052 and separate
  demo MO/PMO accounts, preserves conflicts. Application not independently verified.
- Restore/preserve original shell, @taqaddum/ui, demo.css, 13-entry navigation,
  overview, catalogs, creation modal, FR/AR/EN selector. MonitoringPanel is added,
  not a parallel app; monitoring-integration.css scoped. No fabricated audit data.
- Terrain/GIS is an honest placeholder, not a functioning map. Snapshot display
  refreshes every 30 seconds; calculations are not yet recalculated daily.

## Audit evidence and additional blockers

- Root package scripts: Vitest tests, Prettier, ESLint, tsc build, boundaries,
  OpenAPI lint/bundle and test:contract. Presence is not proof of green results.
- PR workflow inspected: pull_request only, Node 22, pnpm frozen install,
  PostGIS service, bootstrap/migration/fixture glob loops, audit-platform DB test,
  format/lint/typecheck/test/boundaries/Compose/build. OpenAPI lint is not an
  explicit step; other DB suites are not directly invoked by the inspected YAML.
- Critical fresh-install dependency: monitoring SQL alphabetically precedes
  public identity/referential SQL. Two 0004 files also exist. No ledger in that loop.
- Vitest includes all *.test.ts/tsx with global jsdom. Node engine tests therefore
  need Vitest registration and explicit Node environment, not merely a green CLI run.
- identity.sessions already exists with token hash, expiry and revocation. Reuse it.
  identity.users tenant RLS only checks a non-NULL setting in 0003: insufficient
  membership isolation. org.memberships uniqueness allows one row per scoped user;
  scoped multiple roles need explicit design. Existing canonical users lack a
  credential field in inspected migration; inspect references before convergence.
- ADR-001 says NestJS/Fastify. Inspected API package has neither runtime dependency,
  only @fastify/cors, pg and xlsx. Runtime node:http retained pending migration.
- Attachment PROJECT_STATE.md in Perplexity is dated September and stale relative
  to GitHub; do not overwrite this branch state from that attachment.

## Release 0.5 first change set

- Ported monitoring-engine.test.ts from node:test/assert to Vitest test/expect,
  preserving seven original cases and explicit @vitest-environment node.
  No engine, threshold, route, UI, schema or data mutation in this change set.
- Added ADR-003 Fastify modular monolith (supersedes NestJS choice, implementation
  pending), ADR-004 canonical identity/org convergence, ADR-005 node-pg-migrate
  ledger with ordered legacy baseline. Decisions are not implementation claims.
- Next verification in a real checkout: pnpm exec vitest run
  apps/api/src/monitoring-engine.test.ts; pnpm test; format/lint/typecheck/build.
  No CI or local test executed by connector. CI result must be linked before green.
- No PR/issue/branch protection/secret rotation/repository-visibility change
  performed by this change set. These require their own resolved approved actions.

## Delivery order and acceptance

- Contain public data/secrets; rotate disclosed credentials; never assume deleting
  source erases Git history. Owner to confirm public workbook permission.
- Establish CI baseline/Node 22/pnpm, legacy migration dependency/ledger rehearsals,
  typed referential and R/S/V D/I imports, identity/scopes/sessions and deny-by-default
  APIs, Fastify plugin migration/contract tests, router/query/module registry,
  FR/AR behavior parity and doctor/runbook. Preserve old audit/outbox/RLS tests.
- Release 0.5 gate: green CI on PR to main; no unauthenticated business endpoint;
  canonical identity and compatibility validated; versioned typed referential with
  rights; migration ledger; security negative tests; no production demo/mock auth.
- Release 1 after hardening: rights-aware KPI center; DB-configured Wave A/golden
  tests; factual geolocation editor and MapLibre; computed Direction cockpit and
  project 360; alert lifecycle/MVP nine rules; PMO data quality; scoped immutable
  reports. Do not build synthetic demo figures as CNED reality.
- Preserve two delays, uncapped consumption, adjusted/current/delegated AE distinction,
  consolidated works including terminated/parachèvement and separate advances.
  Active means neither completed nor received; current authorized UI counter is
  administrative, not this business definition. CO1/CO6 provisional weights off.
- No coordinates invented; no external map token required. Wilaya list/licence and
  actual geo inputs await owner confirmation. No claim that 43 KPI execute today.
- Formula execution uses reviewed pure functions and versioned config, not eval of
  workbook text. Typed conditions need number/string/boolean/null and missing-vs-null
  semantics. H6 in the supplied prompt is truncated after 'value_type ∈ number';
  acceptance must be derived from the remaining detailed brief, not invented text.

## Security and operating precautions

- Current sessions in memory without expiry/revocation; old project APIs unauthenticated;
  catalogs not role filtered; Direction can select context without full account scope.
  Monitoring tables have no demonstrated tenant RLS coverage. Private demo only,
  no confidential real data until hardening. Passwords must be rotated separately.
- Keep privileged database owner/bootstrap distinct from least-privileged runtime.
  FORCE RLS or tested ownership strategy required; tests must use actual app role.
- No TRUNCATE/reset/forced checkout/broad git add/deletion of local edits.
  curl --max-time; no TypeScript in Bash; standalone heredoc delimiters.
- GitHub connector reads/writes code; it does not execute Codespaces commands or
  CI tests. Keep repository evidence, owner reports and executable results distinct.
