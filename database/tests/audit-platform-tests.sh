#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:=postgresql://postgres:postgres@localhost:5432/taqaddum}"
TENANT=$(psql "$DATABASE_URL" -Atc "SELECT id FROM org.tenants WHERE tenant_code='demo-tenant' LIMIT 1")
ORG=$(psql "$DATABASE_URL" -Atc "SELECT id FROM org.organizations WHERE organization_code='demo-org' LIMIT 1")
ACTOR=$(psql "$DATABASE_URL" -Atc "SELECT id FROM identity.users WHERE email='admin@example.test'")
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO audit.audit_records (tenant_id,organization_id,actor_type,actor_id,action,action_code,target_context,target_aggregate_type,target_aggregate_id,outcome,correlation_id,request_id,record_hash) VALUES ('$TENANT','$ORG','user','$ACTOR','test.insert','test.insert','audit','Test',gen_random_uuid(),'success',gen_random_uuid(),gen_random_uuid(),'hash-test');"
if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "UPDATE audit.audit_records SET reason='blocked' WHERE record_hash='hash-test';"; then exit 1; fi
if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DELETE FROM audit.audit_records WHERE record_hash='hash-test';"; then exit 1; fi
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO platform.outbox_events (tenant_id,organization_id,actor_id,event_type,aggregate_context,aggregate_type,aggregate_id,aggregate_version,payload,payload_schema_version,event_version,schema_version,correlation_id) VALUES ('$TENANT','$ORG','$ACTOR','test.event.v1','platform','Test',gen_random_uuid(),1,'{}',1,1,1,gen_random_uuid());" -c "INSERT INTO platform.api_idempotency_keys (tenant_id,organization_id,actor_id,endpoint_or_command,idempotency_key,request_hash,response_status,expires_at,operation_code,request_fingerprint) VALUES ('$TENANT','$ORG','$ACTOR','test','key-1','hash',200,now()+interval '1 hour','test','hash');" -c "INSERT INTO platform.processed_events (consumer_name,event_id,tenant_id,organization_id,actor_id,outcome) VALUES ('test',gen_random_uuid(),'$TENANT','$ORG','$ACTOR','processed');"
echo 'audit/outbox/idempotency/processed tests: PASS'
