CREATE TABLE IF NOT EXISTS platform.outbox_events (
  id uuid PRIMARY KEY DEFAULT platform.uuid_v7(), tenant_id uuid NOT NULL, organization_id uuid NOT NULL, actor_id uuid NOT NULL,
  event_type text NOT NULL, aggregate_context text NOT NULL, aggregate_type text NOT NULL, aggregate_id uuid NOT NULL,
  aggregate_version integer NOT NULL CHECK (aggregate_version > 0), payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  payload_schema_version integer NOT NULL CHECK (payload_schema_version > 0), occurred_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz, publish_attempts integer NOT NULL DEFAULT 0 CHECK (publish_attempts >= 0),
  last_error text, correlation_id uuid NOT NULL, causation_id uuid, created_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL DEFAULT 1,
  CONSTRAINT ck_outbox_events__published_after_created CHECK (published_at IS NULL OR published_at >= created_at)
);
CREATE INDEX IF NOT EXISTS ix_outbox_events__unpublished ON platform.outbox_events (available_at, occurred_at) WHERE published_at IS NULL;
CREATE TABLE IF NOT EXISTS platform.api_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT platform.uuid_v7(), tenant_id uuid NOT NULL, organization_id uuid NOT NULL, actor_id uuid NOT NULL,
  endpoint_or_command text NOT NULL, idempotency_key text NOT NULL, request_hash text NOT NULL, response_status integer,
  response_body jsonb, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, version integer NOT NULL DEFAULT 1,
  CONSTRAINT uq_api_idempotency_keys__scope UNIQUE (tenant_id, actor_id, endpoint_or_command, idempotency_key),
  CONSTRAINT ck_api_idempotency_keys__expiry CHECK (expires_at > created_at)
);
CREATE TABLE IF NOT EXISTS platform.processed_events (
  consumer_name text NOT NULL, event_id uuid NOT NULL, tenant_id uuid NOT NULL, organization_id uuid NOT NULL, actor_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(), outcome text NOT NULL CHECK (outcome IN ('processed','ignored','failed')), version integer NOT NULL DEFAULT 1,
  CONSTRAINT pk_processed_events PRIMARY KEY (consumer_name, event_id)
);
CREATE TABLE IF NOT EXISTS audit.audit_records (
  id uuid PRIMARY KEY DEFAULT platform.uuid_v7(), occurred_at timestamptz NOT NULL DEFAULT now(), tenant_id uuid NOT NULL, organization_id uuid NOT NULL,
  actor_type text NOT NULL, actor_id uuid NOT NULL, actor_display_snapshot text, action text NOT NULL, target_context text NOT NULL,
  target_aggregate_type text NOT NULL, target_aggregate_id uuid NOT NULL, before_hash text, after_hash text, changed_fields_json jsonb,
  reason text, correlation_id uuid NOT NULL, causation_id uuid, request_id uuid, request_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_record_hash text, record_hash text NOT NULL, version integer NOT NULL DEFAULT 1,
  CONSTRAINT ck_audit_records__metadata_object CHECK (jsonb_typeof(request_metadata) = 'object'),
  CONSTRAINT ck_audit_records__changed_fields_object CHECK (changed_fields_json IS NULL OR jsonb_typeof(changed_fields_json) = 'object')
);
CREATE INDEX IF NOT EXISTS ix_audit_records__tenant_id__occurred_at ON audit.audit_records (tenant_id, occurred_at DESC);
DROP TRIGGER IF EXISTS trg_audit_records__forbid_mutation ON audit.audit_records;
CREATE TRIGGER trg_audit_records__forbid_mutation BEFORE UPDATE OR DELETE ON audit.audit_records FOR EACH ROW EXECUTE FUNCTION audit.forbid_mutation();
