#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:=postgresql://postgres:postgres@localhost:5432/taqaddum}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO audit.audit_records (tenant_id, organization_id, actor_type, actor_id, action, target_context, target_aggregate_type, target_aggregate_id, correlation_id, record_hash) VALUES (gen_random_uuid(), gen_random_uuid(), 'test', gen_random_uuid(), 'test.insert', 'audit', 'test', gen_random_uuid(), gen_random_uuid(), 'test-hash');"
if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "UPDATE audit.audit_records SET reason='blocked' WHERE record_hash='test-hash';"; then echo 'audit mutation unexpectedly succeeded'; exit 1; else echo 'audit mutation blocked: PASS'; fi
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO platform.outbox_events (tenant_id, organization_id, actor_id, event_type, aggregate_context, aggregate_type, aggregate_id, aggregate_version, payload, payload_schema_version, correlation_id) VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'test.event.v1', 'platform', 'test', gen_random_uuid(), 1, '{}'::jsonb, 1, gen_random_uuid());"
echo 'audit/outbox tests: PASS'
