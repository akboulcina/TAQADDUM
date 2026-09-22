DO $$
DECLARE
  v_tenant_id uuid;
  v_org_id uuid;
  v_actor_id uuid;
  v_document_1 uuid := 'd0000000-0000-4000-8000-000000000001';
  v_document_2 uuid := 'd0000000-0000-4000-8000-000000000002';
BEGIN
  SELECT id
  INTO v_tenant_id
  FROM org.tenants
  ORDER BY created_at
  LIMIT 1;

  SELECT id
  INTO v_org_id
  FROM org.organizations
  WHERE tenant_id = v_tenant_id
  ORDER BY created_at
  LIMIT 1;

  SELECT m.user_id
  INTO v_actor_id
  FROM org.memberships m
  WHERE m.tenant_id = v_tenant_id
    AND m.organization_id = v_org_id
    AND m.membership_status = 'active'
  ORDER BY m.created_at
  LIMIT 1;

  IF v_tenant_id IS NULL
     OR v_org_id IS NULL
     OR v_actor_id IS NULL THEN
    RAISE EXCEPTION
      'Required demo tenant, organisation, or active membership fixture is missing';
  END IF;

  INSERT INTO documents.documents (
    id,
    tenant_id,
    organization_id,
    document_code,
    title_fr,
    title_ar,
    title_en,
    document_type,
    classification_code,
    status,
    created_by,
    updated_by
  )
  VALUES (
    v_document_1,
    v_tenant_id,
    v_org_id,
    'DOC-2026-0001',
    'Rapport de visite',
    'تقرير زيارة',
    'Visit Report',
    'field_report_attachment',
    'internal',
    'draft',
    v_actor_id,
    v_actor_id
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO documents.documents (
    id,
    tenant_id,
    organization_id,
    document_code,
    title_fr,
    title_ar,
    title_en,
    document_type,
    classification_code,
    status,
    created_by,
    updated_by
  )
  VALUES (
    v_document_2,
    v_tenant_id,
    v_org_id,
    'DOC-2026-0002',
    'Contrat',
    'عقد',
    'Contract',
    'contract',
    'internal',
    'approved',
    v_actor_id,
    v_actor_id
  )
  ON CONFLICT (id) DO NOTHING;
END
$$;