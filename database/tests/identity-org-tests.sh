#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:=postgresql://postgres:postgres@localhost:5432/taqaddum}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM org.tenants WHERE tenant_code='demo-tenant';" -c "SELECT count(*) FROM org.organizations WHERE organization_code='demo-org';" -c "SELECT count(*) FROM identity.users WHERE email IN ('admin@example.test','user@example.test');" -c "SELECT count(*) FROM org.memberships WHERE membership_status='active';"
echo 'identity/org fixtures: PASS'
