DO $$
DECLARE
  v_tenant_id uuid;
  v_org_id uuid;
  v_actor_id uuid;
BEGIN
  INSERT INTO org.tenants (
    tenant_code, name_fr, name_ar, name_en, status, created_by, updated_by
  )
  VALUES (
    'demo-tenant', 'Démo', 'تجريبي', 'Demo', 'active', gen_random_uuid(), gen_random_uuid()
  )
  ON CONFLICT (tenant_code) DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    status = EXCLUDED.status,
    updated_by = gen_random_uuid()
  RETURNING id INTO v_tenant_id;

  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM org.tenants WHERE tenant_code = 'demo-tenant';
  END IF;

  INSERT INTO org.organizations (
    tenant_id, organization_code, name_fr, name_ar, name_en, status, created_by, updated_by
  )
  VALUES (
    v_tenant_id, 'demo-org', 'Démo Org', 'منظمة تجريبية', 'Demo Org', 'active', gen_random_uuid(), gen_random_uuid()
  )
  ON CONFLICT (organization_code) DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    status = EXCLUDED.status,
    updated_by = gen_random_uuid()
  RETURNING id INTO v_org_id;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM org.organizations WHERE organization_code = 'demo-org';
  END IF;

  INSERT INTO identity.users (
    tenant_id, email, display_name, status, created_by, updated_by
  )
  VALUES (
    v_tenant_id, 'admin@example.test', 'Demo Admin', 'active', gen_random_uuid(), gen_random_uuid()
  )
  ON CONFLICT (tenant_id, email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    status = EXCLUDED.status,
    updated_by = gen_random_uuid()
  RETURNING id INTO v_actor_id;

  IF v_actor_id IS NULL THEN
    SELECT id INTO v_actor_id FROM identity.users
    WHERE tenant_id = v_tenant_id AND email = 'admin@example.test';
  END IF;
END
$$;
