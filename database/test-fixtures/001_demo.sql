<<<<<<< HEAD
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
=======
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
      v_tenant_id,
      'demo-tenant',
      'Démo',
      'تجريبي',
      'Demo',
      'active',
      gen_random_uuid(),
      gen_random_uuid()
    );
  ELSE
    UPDATE org.tenants
    SET
      name_fr = 'Démo',
      name_ar = 'تجريبي',
      name_en = 'Demo',
      status = 'active',
      updated_by = gen_random_uuid()
    WHERE id = v_tenant_id;
  END IF;

  SELECT id INTO v_org_id
  FROM org.organizations
  WHERE tenant_id = v_tenant_id
    AND organization_code = 'demo-org'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    v_org_id := gen_random_uuid();

    INSERT INTO org.organizations (
      id,
      tenant_id,
      organization_code,
      name_fr,
      name_ar,
      name_en,
      status,
      created_by,
      updated_by
    )
    VALUES (
      v_org_id,
      v_tenant_id,
      'demo-org',
      'Démo Org',
      'منظمة تجريبية',
      'Demo Org',
      'active',
      gen_random_uuid(),
      gen_random_uuid()
    );
  ELSE
    UPDATE org.organizations
    SET
      name_fr = 'Démo Org',
      name_ar = 'منظمة تجريبية',
      name_en = 'Demo Org',
      status = 'active',
      updated_by = gen_random_uuid()
    WHERE id = v_org_id;
  END IF;

  SELECT id INTO v_actor_id
  FROM identity.users
  WHERE email = 'admin@example.test'
  LIMIT 1;

  IF v_actor_id IS NULL THEN
    v_actor_id := gen_random_uuid();

    INSERT INTO identity.users (
      id,
      email,
      display_name,
      preferred_locale,
      is_active,
      created_by,
      updated_by
    )
    VALUES (
      v_actor_id,
      'admin@example.test',
      'Demo Admin',
      'fr',
      true,
      v_actor_id,
      v_actor_id
    );
  ELSE
    UPDATE identity.users
    SET
      display_name = 'Demo Admin',
      preferred_locale = 'fr',
      is_active = true,
      updated_by = v_actor_id
    WHERE id = v_actor_id;
  END IF;

  INSERT INTO org.memberships (
    id,
    tenant_id,
    organization_id,
    user_id,
    membership_status,
    role_code,
    granted_by,
    created_by,
    updated_by
  )
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_org_id,
    v_actor_id,
    'active',
    'org_admin',
    v_actor_id,
    v_actor_id,
    v_actor_id
  )
  ON CONFLICT (tenant_id, organization_id, user_id)
  DO UPDATE SET
    membership_status = 'active',
    role_code = 'org_admin',
    updated_by = v_actor_id;
END
$$;
>>>>>>> origin/feat/pr-004-audit-platform
