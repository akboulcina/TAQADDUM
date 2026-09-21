DO $$
DECLARE
  v_tenant_id uuid;
  v_org_id uuid;
  v_actor_id uuid;
BEGIN
  SELECT id INTO v_tenant_id
  FROM org.tenants
  WHERE tenant_code = 'demo-tenant'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    v_tenant_id := gen_random_uuid();
    INSERT INTO org.tenants (
      id, tenant_code, name_fr, name_ar, name_en, status, created_by, updated_by
    )
    VALUES (
      v_tenant_id, 'demo-tenant', 'Démo', 'تجريبي', 'Demo', 'active', gen_random_uuid(), gen_random_uuid()
    );
  ELSE
    UPDATE org.tenants
    SET name_fr = 'Démo', name_ar = 'تجريبي', name_en = 'Demo', status = 'active', updated_by = gen_random_uuid()
    WHERE id = v_tenant_id;
  END IF;

  SELECT id INTO v_org_id
  FROM org.organizations
  WHERE tenant_id = v_tenant_id AND organization_code = 'demo-org'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    v_org_id := gen_random_uuid();
    INSERT INTO org.organizations (
      id, tenant_id, organization_code, name_fr, name_ar, name_en, status, created_by, updated_by
    )
    VALUES (
      v_org_id, v_tenant_id, 'demo-org', 'Démo Org', 'منظمة تجريبية', 'Demo Org', 'active', gen_random_uuid(), gen_random_uuid()
    );
  ELSE
    UPDATE org.organizations
    SET name_fr = 'Démo Org', name_ar = 'منظمة تجريبية', name_en = 'Demo Org', status = 'active', updated_by = gen_random_uuid()
    WHERE id = v_org_id;
  END IF;

  SELECT id INTO v_actor_id
  FROM identity.users
  WHERE organization_id = v_org_id AND email = 'admin@example.test'
  LIMIT 1;

  IF v_actor_id IS NULL THEN
    INSERT INTO identity.users (
      id, organization_id, email, display_name, status, created_by, updated_by
    )
    VALUES (
      gen_random_uuid(), v_org_id, 'admin@example.test', 'Demo Admin', 'active', gen_random_uuid(), gen_random_uuid()
    );
  ELSE
    UPDATE identity.users
    SET display_name = 'Demo Admin', status = 'active', updated_by = gen_random_uuid()
    WHERE id = v_actor_id;
  END IF;
END
$$;
