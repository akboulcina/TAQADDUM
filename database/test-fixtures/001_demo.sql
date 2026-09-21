  SELECT id INTO v_actor_id
  FROM identity.users
  WHERE email = 'admin@example.test'
  LIMIT 1;

  IF v_actor_id IS NULL THEN
    v_actor_id := gen_random_uuid();

    INSERT INTO identity.users (
      id, email, display_name, preferred_locale,
      is_active, created_by, updated_by
    )
    VALUES (
      v_actor_id, 'admin@example.test', 'Demo Admin', 'fr',
      true, gen_random_uuid(), gen_random_uuid()
    );
  ELSE
    UPDATE identity.users
    SET display_name = 'Demo Admin',
        is_active = true,
        updated_by = gen_random_uuid()
    WHERE id = v_actor_id;
  END IF;

  INSERT INTO org.memberships (
    id, tenant_id, organization_id, user_id,
    membership_status, role_code, granted_by,
    created_by, updated_by
  )
  VALUES (
    gen_random_uuid(), v_tenant_id, v_org_id, v_actor_id,
    'active', 'org_admin', v_actor_id,
    v_actor_id, v_actor_id
  )
  ON CONFLICT (tenant_id, organization_id, user_id) DO UPDATE SET
    membership_status = 'active',
    role_code = 'org_admin',
    updated_by = v_actor_id;