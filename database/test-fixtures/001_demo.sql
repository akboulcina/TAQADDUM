INSERT INTO org.tenants (
  id,
  tenant_code,
  name_fr,
  name_ar,
  name_en,
  status,
  created_by,
  updated_by
)
VALUES (
  platform.uuid_v7(),
  'demo-tenant',
  'Démo',
  'تجريبي',
  'Demo',
  'active',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (tenant_code)
DO UPDATE SET
  name_fr = EXCLUDED.name_fr,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  status = EXCLUDED.status,
  updated_by = EXCLUDED.updated_by;
