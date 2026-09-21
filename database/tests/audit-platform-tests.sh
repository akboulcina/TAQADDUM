
#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:=postgresql://taqaddum:taqaddum_local_only@localhost:5432/taqaddum}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'audit') THEN
    RAISE EXCEPTION 'audit schema is missing; run database bootstrap first';
  END IF;
END
$$;
SQL

TENANT=$(psql "$DATABASE_URL" -Atc "SELECT id FROM org.tenants WHERE tenant_code='demo-tenant' LIMIT 1")
ORG=$(psql "$DATABASE_URL" -Atc "SELECT id FROM org.organizations WHERE organization_code='demo-org' LIMIT 1")
ACTOR=$(psql "$DATABASE_URL" -Atc "SELECT id FROM identity.users WHERE email='admin@example.test' LIMIT 1")

: "${TENANT:?demo tenant fixture is missing}"
: "${ORG:?demo organization fixture is missing}"
: "${ACTOR:?admin fixture is missing}"

RECORD_ID=$(psql "$DATABASE_URL" -Atc "
  INSERT INTO audit.audit_records (
    tenant_id, organization_id, actor_type, actor_id, action, action_code,
    target_context, target_aggregate_type, target_aggregate_id, outcome,
    correlation_id, request_id, record_hash
  )
  VALUES (
    '$TENANT', '$ORG', 'user', '$ACTOR', 'test.insert', 'test.insert',
    'audit', 'Test', gen_random_uuid(), 'success', gen_random_uuid(),
    gen_random_uuid(), 'hash-test'
  )
  RETURNING id
")

: "${RECORD_ID:?audit record insertion failed}"

if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
UPDATE audit.audit_records
SET reason = 'blocked'
WHERE id = '$RECORD_ID';
SQL
then
  echo 'Expected audit mutation to fail, but it succeeded'
  exit 1
else
  echo 'Audit immutability check passed'
fi