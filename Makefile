SHELL := /bin/sh

DB_SERVICE ?= postgres
DB_USER ?= taqaddum
DB_NAME ?= taqaddum

.PHONY: up down migrate seed seed-identity seed-documents db-check test test-audit test-outbox test-documents

up:
	docker compose up -d $(DB_SERVICE)

down:
	docker compose down

migrate:
	@set -eu; \
	for f in database/bootstrap/*.sql database/roles/grants.sql database/migrations/*.sql; do \
		echo "Applying $$f"; \
		docker compose exec -T $(DB_SERVICE) psql \
			-U $(DB_USER) \
			-d $(DB_NAME) \
			-v ON_ERROR_STOP=1 < "$$f" || exit 1; \
	done

seed:
	docker compose exec -T $(DB_SERVICE) psql \
		-U $(DB_USER) \
		-d $(DB_NAME) \
		-v ON_ERROR_STOP=1 < database/test-fixtures/001_demo.sql

seed-identity:
	docker compose exec -T $(DB_SERVICE) psql \
		-U $(DB_USER) \
		-d $(DB_NAME) \
		-v ON_ERROR_STOP=1 < database/test-fixtures/002_identity_org.sql

seed-documents:
	docker compose exec -T $(DB_SERVICE) psql \
		-U $(DB_USER) \
		-d $(DB_NAME) \
		-v ON_ERROR_STOP=1 < database/test-fixtures/003_documents.sql

db-check:
	docker compose exec -T $(DB_SERVICE) psql \
		-U $(DB_USER) \
		-d $(DB_NAME) \
		-v ON_ERROR_STOP=1 < database/verification/check-ownership.sql
	docker compose exec -T $(DB_SERVICE) psql \
		-U $(DB_USER) \
		-d $(DB_NAME) \
		-v ON_ERROR_STOP=1 < database/verification/check-audit-platform.sql

test:
	DATABASE_URL="postgresql://$(DB_USER):$(DB_USER)@localhost:5432/$(DB_NAME)" \
		sh database/tests/db-tests.sh
	DATABASE_URL="postgresql://$(DB_USER):$(DB_USER)@localhost:5432/$(DB_NAME)" \
		sh database/tests/identity-org-tests.sh
	DATABASE_URL="postgresql://$(DB_USER):$(DB_USER)@localhost:5432/$(DB_NAME)" \
		sh database/tests/audit-platform-tests.sh

test-audit:
	DATABASE_URL="postgresql://$(DB_USER):$(DB_USER)@localhost:5432/$(DB_NAME)" \
		sh database/tests/audit-platform-tests.sh

test-outbox:
	DATABASE_URL="postgresql://$(DB_USER):$(DB_USER)@localhost:5432/$(DB_NAME)" \
		sh database/tests/outbox-tests.sh

test-documents:
	docker compose exec -T $(DB_SERVICE) \
		env DATABASE_URL="postgresql://$(DB_USER):$(DB_USER)@localhost:5432/$(DB_NAME)" \
		sh -s < database/tests/documents-tests.sh
		sh database/tests/documents-tests.sh

.PHONY: storybook

storybook:
	cd apps/storybook && pnpm storybook
