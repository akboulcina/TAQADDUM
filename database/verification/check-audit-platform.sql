SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','postgis','citext','btree_gist','pg_trgm') ORDER BY extname;
SELECT to_regclass('audit.audit_records') AS audit_records,to_regclass('platform.outbox_events') AS outbox_events,to_regclass('platform.api_idempotency_keys') AS idempotency_keys,to_regclass('platform.processed_events') AS processed_events;
SELECT tgname FROM pg_trigger WHERE tgrelid='audit.audit_records'::regclass AND NOT tgisinternal;
