DO $$
DECLARE
  v_tenant_id uuid;
  v_org_id uuid;
  v_actor_id uuid;
BEGIN
  SELECT id
  INTO v_tenant_id
  FROM org.tenants
  WHERE tenant_code = 'demo-tenant'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'demo tenant fixture is missing';
  END IF;

  SELECT id
  INTO v_org_id
  FROM org.organizations
  WHERE tenant_id = v_tenant_id
    AND organization_code = 'demo-org'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'demo organization fixture is missing';
  END IF;

  SELECT id
  INTO v_actor_id
  FROM identity.users
  WHERE email = 'admin@example.test'
  LIMIT 1;

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'demo user fixture is missing';
  END IF;

  INSERT INTO project.projects AS p (
    id,
    tenant_id,
    organization_id,
    project_code,
    name_fr,
    name_ar,
    name_en,
    description_fr,
    description_ar,
    description_en,
    status,
    version,
    created_by,
    updated_by
  )
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_org_id,
    'PRJ-2026-0001',
    'Projet Démo',
    'المشروع التجريبي',
    'Demo Project',
    'Projet de démonstration',
    'مشروع تجريبي',
    'Demo project',
    'draft',
    1,
    v_actor_id,
    v_actor_id
  )
  ON CONFLICT (tenant_id, project_code)
  WHERE archived_at IS NULL
  DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    description_fr = EXCLUDED.description_fr,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en,
    status = 'authorized',
    authorized_at = COALESCE(p.authorized_at, EXCLUDED.authorized_at),
    authorized_by = EXCLUDED.authorized_by,
    version = GREATEST(p.version, EXCLUDED.version),
    updated_by = v_actor_id;

  INSERT INTO project.projects AS p (
    id,
    tenant_id,
    organization_id,
    project_code,
    name_fr,
    name_ar,
    name_en,
    description_fr,
    description_ar,
    description_en,
    status,
    authorized_at,
    authorized_by,
    version,
    created_by,
    updated_by
  )
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_org_id,
    'PRJ-2026-0002',
    'Projet Autorisé',
    'المشروع المفوض',
    'Authorized Project',
    'Projet autorisé',
    'مشروع مفوض',
    'Authorized project',
    'authorized',
    now(),
    v_actor_id,
    2,
    v_actor_id,
    v_actor_id
  )
  ON CONFLICT (tenant_id, project_code)
  WHERE archived_at IS NULL
  DO UPDATE SET
    name_fr = EXCLUDED.name_fr,
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    description_fr = EXCLUDED.description_fr,
    description_ar = EXCLUDED.description_ar,
    description_en = EXCLUDED.description_en,
    status = 'authorized',
    authorized_at = COALESCE(p.authorized_at, EXCLUDED.authorized_at),
    authorized_by = EXCLUDED.authorized_by,
    version = GREATEST(p.version, EXCLUDED.version),
    updated_by = v_actor_id;
END
$$;
