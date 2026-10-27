# ADR-003 — Fastify modular monolith

## Status and scope

Accepted target architecture, 2026-10-27, per Master Build Prompt v2.
Supersedes the NestJS choice in ADR-001. This document does not mean that
Fastify is already implemented. ADR-001 remains historical evidence.

## Context

The inspected API package has pg, xlsx and @fastify/cors dependencies but
no Fastify or NestJS runtime dependency. The application uses node:http.
The existing MO submission, independent PMO validation, immutable snapshots,
formula version and stored alert evidence must survive the transition.

## Decision

Use a TypeScript Fastify modular monolith. Add identity, referential,
project, monitoring, alerts, reports, geo and admin plugins incrementally.
Keep existing web-consumed route paths and response contracts until an
explicit versioned contract change is approved and tested.

Use Zod input schemas and JSON Schema/OpenAPI adapters compatible with the
selected Fastify version. Validate bodies, params, query and context before
handlers. Emit application/problem+json with stable machine-readable codes.

Use a shared pg.Pool. Every transaction, including RLS context, runs on one
checked-out connection with BEGIN, SET LOCAL context, COMMIT/ROLLBACK and
release in finally. A pool.query call must not continue another connection's
transaction. Resolve the account's memberships before setting context;
request headers are selectors, never evidence of authority.

Domain calculators move to packages/kpi-engine and packages/alert-engine as
pure TypeScript, without framework or database imports. Database-configured,
versioned formula identifiers, parameters, directions and thresholds select
reviewed deterministic implementations; never eval Excel prose, SQL or JS.
Preserve monitoring-1 as a differential-test oracle until migration passes.

## Delivery and acceptance

Start with an injectable app factory and health/identity plugins. Move one
module at a time behind contract and cross-scope tests. Preserve current UI,
ports, relative URLs and Vite proxies. Remove obsolete transport only after
parity tests pass. Do not introduce NestJS or a second public API.

CI must run OpenAPI lint, route conformance, unit/integration tests, RLS
negative tests and dependency boundaries. No business route is unauthenticated
at Release 0.5 completion; health and login are intentionally public with
appropriate controls. Framework replacement alone is not hardening completion.

## Consequences

Fastify supplies the transport, not business permissions. Plugin boundaries,
audit, explicit authorization and reviewed SQL remain engineering obligations.
New dependencies require lockfile updates by pnpm and a reproducible build;
never fabricate lockfile entries through text editing.
