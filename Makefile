SHELL := /bin/sh
DATABASE_URL ?= postgresql://postgres:postgres@localhost:5432/taqaddum

.PHONY: up down migrate seed db-check test

up:
	docker compose up -d postgres

down:
	docker compose down

migrate:
	@set -eu; for f in database/bootstrap/*.sql database/roles/grants.sql database/migrations/*.sql; do echo "Applying $$f"; psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$$f"; done

seed:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/test-fixtures/001_demo.sql

db-check:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -c "SELECT extname FROM pg_extension WHERE extname IN ('postgis','pgcrypto','citext','btree_gist','pg_trgm') ORDER BY extname;"; psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/verification/check-ownership.sql; psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -c "SELECT to_regclass('audit.audit_records'), to_regclass('platform.outbox_events'), to_regclass('platform.api_idempotency_keys'), to_regclass('platform.processed_events');"

test:
	@DATABASE_URL="$(DATABASE_URL)" sh database/tests/db-tests.sh
