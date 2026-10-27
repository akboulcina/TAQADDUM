CREATE OR REPLACE FUNCTION audit.compute_record_hash(
  p_action_code text,
  p_target_context text,
  p_target_aggregate_type text,
  p_target_aggregate_id uuid,
  p_outcome text,
  p_before_snapshot jsonb,
  p_after_snapshot jsonb,
  p_previous_hash text
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(
    sha256(
      (
        coalesce(p_previous_hash, '') || '|' ||
        p_action_code || '|' ||
        p_target_context || '|' ||
        p_target_aggregate_type || '|' ||
        p_target_aggregate_id::text || '|' ||
        p_outcome || '|' ||
        coalesce(p_before_snapshot::text, '') || '|' ||
        coalesce(p_after_snapshot::text, '')
      )::bytea
    ),
    'hex'
  );
END
$$;

ALTER TABLE audit.audit_records
  ADD COLUMN IF NOT EXISTS action_code text;

ALTER TABLE audit.audit_records
  ADD COLUMN IF NOT EXISTS outcome text;

ALTER TABLE audit.audit_records
  ADD COLUMN IF NOT EXISTS before_snapshot jsonb;

ALTER TABLE audit.audit_records
  ADD COLUMN IF NOT EXISTS after_snapshot jsonb;

ALTER TABLE audit.audit_records
  ADD COLUMN IF NOT EXISTS metadata jsonb;

ALTER TABLE audit.audit_records
  ADD COLUMN IF NOT EXISTS request_id uuid;

ALTER TABLE audit.audit_records
  DROP CONSTRAINT IF EXISTS ck_audit_records__actor_type;

ALTER TABLE audit.audit_records
  ADD CONSTRAINT ck_audit_records__actor_type
  CHECK (actor_type IN ('user', 'service', 'system'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_audit_records__outcome'
      AND conrelid = 'audit.audit_records'::regclass
  ) THEN
    ALTER TABLE audit.audit_records
      ADD CONSTRAINT ck_audit_records__outcome
      CHECK (outcome IN ('success', 'failure', 'denied', 'validation_error'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_audit_records__target
  ON audit.audit_records (
    tenant_id,
    target_context,
    target_aggregate_type,
    target_aggregate_id
  );

ALTER TABLE platform.outbox_events
  ADD COLUMN IF NOT EXISTS event_version integer NOT NULL DEFAULT 1;

ALTER TABLE platform.outbox_events
  ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1;

ALTER TABLE platform.outbox_events
  ADD COLUMN IF NOT EXISTS idempotency_key text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_outbox_events__payload_object_v2'
      AND conrelid = 'platform.outbox_events'::regclass
  ) THEN
    ALTER TABLE platform.outbox_events
      ADD CONSTRAINT ck_outbox_events__payload_object_v2
      CHECK (jsonb_typeof(payload) = 'object');
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_outbox_events__tenant_id__aggregate
  ON platform.outbox_events (
    tenant_id,
    aggregate_context,
    aggregate_type,
    aggregate_id
  );

ALTER TABLE platform.api_idempotency_keys
  ADD COLUMN IF NOT EXISTS operation_code text NOT NULL DEFAULT 'unknown';

ALTER TABLE platform.api_idempotency_keys
  ADD COLUMN IF NOT EXISTS request_fingerprint text NOT NULL DEFAULT 'unknown';

ALTER TABLE platform.processed_events
  ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE platform.processed_events
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ix_processed_events__consumer_name__processed_at
  ON platform.processed_events (consumer_name, processed_at DESC);