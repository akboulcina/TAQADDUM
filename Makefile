SHELL := /bin/sh
DATABASE_URL ?= postgresql://postgres:postgres@localhost:5432/taqaddum
<<<<<<< HEAD

.PHONY: up down migrate seed seed-identity seed-projects db-check test

up:
	@docker compose up -d postgres

down:
	@docker compose down

migrate:
	@set -eu; \
	for f in database/bootstrap/*.sql database/roles/grants.sql database/migrations/*.sql; do \
		echo "Applying $$f"; \
		psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$$f"; \
	done

=======
.PHONY: up down migrate seed seed-identity db-check test test-audit test-outbox
up:
	docker compose up -d postgres
down:
	docker compose down
migrate:
	@set -eu; for f in database/bootstrap/*.sql database/roles/grants.sql database/migrations/*.sql; do echo "Applying $$f"; psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$$f"; done
>>>>>>> origin/feat/pr-004-audit-platform
seed:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/test-fixtures/001_demo.sql
seed-identity:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/test-fixtures/002_identity_org.sql
<<<<<<< HEAD

seed-projects:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/test-fixtures/003_projects.sql

db-check:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -c "SELECT extname FROM pg_extension WHERE extname IN ('postgis','pgcrypto','citext','btree_gist','pg_trgm') ORDER BY extname;"
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/verification/check-ownership.sql
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -c "SELECT to_regclass('identity.users'), to_regclass('org.tenants'), to_regclass('org.organizations'), to_regclass('org.memberships');"

=======
db-check:
	@psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/verification/check-ownership.sql; psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f database/verification/check-audit-platform.sql
>>>>>>> origin/feat/pr-004-audit-platform
test:
	@DATABASE_URL="$(DATABASE_URL)" sh database/tests/db-tests.sh; DATABASE_URL="$(DATABASE_URL)" sh database/tests/identity-org-tests.sh; DATABASE_URL="$(DATABASE_URL)" sh database/tests/audit-platform-tests.sh

test-audit:
	@DATABASE_URL="$(DATABASE_URL)" sh database/tests/audit-platform-tests.sh

test-outbox:
	@DATABASE_URL="$(DATABASE_URL)" sh database/tests/audit-platform-tests.sh
