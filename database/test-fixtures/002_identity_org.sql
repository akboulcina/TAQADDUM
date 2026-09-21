DO $$
DECLARE
  v_tenant_id uuid;
  v_org_id uuid;
  v_bootstrap_id uuid;
BEGIN
  v_bootstrap_id := '00000000-0000-0000-0000-000000000001'::uuid;

  SELECT t.id
  INTO v_tenant_id
  FROM org.tenants AS t
  WHERE t.tenant_code = 'demo-tenant'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'demo tenant fixture is missing';
  END IF;

  INSERT INTO identity.users (
    id,
    email,
    display_name,
    created_by,
    updated_by
  )
  VALUES (
    v_bootstrap_id,
    'admin@example.test',
    'Demo Administrator',
    v_bootstrap_id,
    v_bootstrap_id
  )
  ON CONFLICT (email)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    updated_by = EXCLUDED.updated_by;

  v_org_id := platform.uuid_v7();

  INSERT INTO org.organizations (
    id,
    tenant_id,
    organization_code,
    name_fr,
    name_ar,
    name_en,
    created_by,
    updated_by
  )
  VALUES (
    v_org_id,
    v_tenant_id,
    'demo-org',
    'Organisation Démo',
    'المنظمة التجريبية',
    'Demo Organization',
    v_bootstrap_id,
    v_bootstrap_id
  )
  ON CONFLICT (tenant_id, organization_code)
  DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    updated_by = EXCLUDED.updated_by;
END
$$;
