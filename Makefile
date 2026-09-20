.PHONY: install up down logs health lint test build boundaries
install:
	pnpm install --frozen-lockfile
up:
	docker compose up -d --build
down:
	docker compose down
logs:
	docker compose logs -f --tail=200
health:
	curl --fail --silent http://localhost:3000/health/live
	curl --fail --silent http://localhost:3000/health/ready
lint:
	pnpm format:check && pnpm lint && pnpm typecheck
test:
	pnpm test
build:
	pnpm build
boundaries:
	pnpm boundaries
