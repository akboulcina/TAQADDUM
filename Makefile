SHELL := /bin/sh
DATABASE_URL ?= postgresql://postgres:postgres@localhost:5432/taqaddum
.PHONY: up down migrate seed seed-identity db-check test test-audit test-outbox
up:
	docker compose up -d postgres
down:
	docker compose down
migrate:
	@set -eu; for f in database/bootstrap/*.sql database/roles/grants.sql database/migrations/*.sql; do echo "Applying $$f"; psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$$f"; done
seed:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/test-fixtures/001_demo.sql
seed-identity:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/test-fixtures/002_identity_org.sql
db-check:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/verification/check-ownership.sql; psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/verification/check-audit-platform.sql
test:
	@DATABASE_URL="$(DATABASE_URL)" sh database/tests/db-tests.sh; DATABASE_URL="$(DATABASE_URL)" sh database/tests/identity-org-tests.sh; DATABASE_URL="$(DATABASE_URL)" sh database/tests/audit-platform-tests.sh

test-audit:
	@DATABASE_URL="$(DATABASE_URL)" sh database/tests/audit-platform-tests.sh

test-outbox:
	@DATABASE_URL="$(DATABASE_URL)" sh database/tests/audit-platform-tests.sh
