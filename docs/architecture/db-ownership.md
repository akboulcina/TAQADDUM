# Database ownership architecture

TAQADDUM uses one PostgreSQL/PostGIS database with schemas per bounded context. Each schema is owned by `taq_<module>_owner`; runtime access is through `taq_<module>_app`, and diagnostics/read workloads use `taq_<module>_ro`. `taq_migrator` is reserved for migration deployment.

Runtime roles receive no DDL and no private cross-schema access. Modules communicate through application facades, published events, or approved rebuildable read projections. Cross-context references are scalar UUIDs validated by application contracts; private cross-schema foreign keys are not used.

High-assurance tables prepare for RLS by requiring tenant context (`app.tenant_id`) in application transactions. RLS policies are enabled as each sensitive business table is introduced; this PR establishes the technical audit/outbox foundation without introducing business tables.

Naming uses lowercase snake_case and explicit `pk_`, `fk_`, `uq_`, `ck_`, `ix_`, `trg_` prefixes. Audit and event records are append-only or idempotent by design.
