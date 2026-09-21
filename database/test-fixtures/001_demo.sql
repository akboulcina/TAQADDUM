INSERT INTO org.tenants (tenant_code, name_fr, name_ar, name_en, status, created_by, updated_by)
VALUES ('demo-tenant', 'Démo', 'تجريبي', 'Demo', 'active', 'fixture', 'fixture')
ON CONFLICT (tenant_code) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  status = EXCLUDED.status,
  updated_by = EXCLUDED.updated_by;

INSERT INTO org.organizations (tenant_id, organization_code, name_fr, name_ar, name_en, status, created_by, updated_by)
SELECT id, 'demo-org', 'Démo Org', 'منظمة تجريبية', 'Demo Org', 'active', 'fixture', 'fixture'
FROM org.tenants WHERE tenant_code='demo-tenant'
ON CONFLICT (organization_code) DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  status = EXCLUDED.status,
  updated_by = EXCLUDED.updated_by;

INSERT INTO identity.users (tenant_id, email, display_name, status, created_by, updated_by)
SELECT id, 'admin@example.test', 'Demo Admin', 'active', 'fixture', 'fixture'
FROM org.tenants WHERE tenant_code='demo-tenant'
ON CONFLICT (tenant_id, email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  status = EXCLUDED.status,
  updated_by = EXCLUDED.updated_by;
