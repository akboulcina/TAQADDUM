# ADR-004 — Converge on identity and org schemas

## Status

Accepted target and staged migration plan, 2026-10-27, per Master Build Prompt
v2. Implementation and database verification are pending.

## Existing assets and gaps

0003_identity_org.sql already defines identity.users, roles, permissions,
user_roles, role_permissions, sessions and org tenants/organizations/memberships.
identity.sessions already has a unique token hash, expiry and revocation.
Reuse it rather than creating a third session model. identity.users has no
password-hash column in this migration; add a separate credential adapter/table
without exposing hashes in compatibility views. ADR-002 keeps mock OIDC local
and test only; production startup must reject it.

The existing identity.users RLS policy checks only whether a tenant setting
is non-NULL. It does not establish user membership of that tenant. Existing
org.memberships permits one row per user/tenant/organization. Preserve the
membership entity and represent multiple business roles separately rather
than silently overwriting its role_code. Inspect audit and other foreign keys
before choosing an ID remapping or renaming any table.

## Decision

Make identity.* and org.* the canonical identity and scope models. Preserve
existing identity UUIDs. Build an explicit reviewed legacy-to-canonical mapping
by normalized email, with collision reports and no automatic account merge.
Preserve legacy snapshot authors through checked FK migration/mapping.

Use opaque random session tokens, persist only their hashes in identity.sessions,
check active account, expiry, revocation and scope on each authenticated request.
Implement server logout/revocation, login throttling and a password policy.
Feature-flagged PMO/Admin MFA must fail closed when the flag is required.
The production IdP remains behind the existing IdentityProvider abstraction;
no mandatory foreign identity SaaS is introduced.

Authenticate once, authorize every operation. Effective business rights combine
active scoped membership, role permissions, imported R/S/V or D/I matrix, and
object assignment. Contractor access is contract-scoped, not just project-scoped.
PLATFORM_ADMIN has no implicit business KPI or financial read privilege.

Use non-owner/non-BYPASSRLS application connections and test the exact runtime
role. Establish tenant/organization coherence in constraints and RLS. Cross-tenant
negative tests include forged headers, revoked membership, pooled connection
reuse, guessed object IDs and financial reads. A non-NULL setting is insufficient.

## Non-destructive migration sequence

1. Inventory references and produce an account/role collision dry-run.
2. Add credential, role-scope and membership constraints incrementally.
3. Copy/map legacy identities and business roles with count and FK reconciliation.
4. Move sessions and authenticated routes, preserving route contracts.
5. Repoint dependent FKs safely and expose narrow public compatibility views;
   no password/session hashes or unrestricted financial data in those views.
6. Retire legacy writes only after parity and rollback rehearsal pass.

No TRUNCATE, ID regeneration, forced account merge or indiscriminate CASCADE.
Compatibility views require an explicit write strategy and RLS-safe access;
they are not a shortcut around canonical authorization. Reads of protected
financial data and changes of permissions are audited without recording secrets.
