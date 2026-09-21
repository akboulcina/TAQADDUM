DO $$
DECLARE
  v_admin_id uuid := platform.uuid_v7();
  v_user_id uuid := platform.uuid_v7();
  v_tenant_id uuid;
  v_org_id uuid;
  v_bootstrap_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO org.tenants (id, tenant_code, name_fr, name_ar, name_en, created_by, updated_by)
  VALUES (platform.uuid_v7(), 'demo-tenant', 'Tenant Démo', 'الجهة التجريبية', 'Demo Tenant', v_bootstrap_id, v_bootstrap_id)
  ON CONFLICT (tenant_code) DO UPDATE SET name_fr=EXCLUDED.name_fr, name_ar=EXCLUDED.name_ar, name_en=EXCLUDED.name_en, status='active';

  SELECT t.id INTO v_tenant_id FROM org.tenants AS t WHERE t.tenant_code='demo-tenant';

  INSERT INTO org.organizations (id, tenant_id, organization_code, name_fr, name_ar, name_en, created_by, updated_by)
  VALUES (platform.uuid_v7(), v_tenant_id, 'demo-org', 'Organisation Démo', 'المنظمة التجريبية', 'Demo Organization', v_bootstrap_id, v_bootstrap_id)
  ON CONFLICT (tenant_id, organization_code) DO UPDATE SET name_fr=EXCLUDED.name_fr, name_ar=EXCLUDED.name_ar, name_en=EXCLUDED.name_en, status='active';

  SELECT o.id INTO v_org_id FROM org.organizations AS o WHERE o.tenant_id=v_tenant_id AND o.organization_code='demo-org';

  INSERT INTO identity.users (id,email,display_name,preferred_locale,created_by,updated_by)
  VALUES (v_admin_id,'admin@example.test','Admin Demo','fr',v_bootstrap_id,v_bootstrap_id), (v_user_id,'user@example.test','User Demo','fr',v_bootstrap_id,v_bootstrap_id)
  ON CONFLICT (email) DO UPDATE SET display_name=EXCLUDED.display_name, is_active=true, updated_at=now(), updated_by=v_bootstrap_id;

  INSERT INTO identity.roles (id,role_code,name_fr,name_ar,name_en,description,created_by)
  VALUES (platform.uuid_v7(),'org_admin','Administrateur organisation','مسؤول المنظمة','Organization admin','Demo role',v_bootstrap_id), (platform.uuid_v7(),'user','Utilisateur','مستخدم','User','Demo role',v_bootstrap_id)
  ON CONFLICT (role_code) DO NOTHING;

  INSERT INTO identity.permissions (id,permission_code,name_fr,name_ar,name_en,description,created_by)
  VALUES (platform.uuid_v7(),'projects.read','Lire les projets','قراءة المشاريع','Read projects','Demo permission',v_bootstrap_id), (platform.uuid_v7(),'projects.create','Créer des projets','إنشاء المشاريع','Create projects','Demo permission',v_bootstrap_id), (platform.uuid_v7(),'audit.read','Lire les audits','قراءة سجلات التدقيق','Read audit records','Demo permission',v_bootstrap_id)
  ON CONFLICT (permission_code) DO NOTHING;

  INSERT INTO org.memberships (tenant_id,organization_id,user_id,role_code,granted_by,created_by,updated_by)
  SELECT v_tenant_id,v_org_id,u.id,'org_admin',v_bootstrap_id,v_bootstrap_id,v_bootstrap_id FROM identity.users AS u WHERE u.email='admin@example.test'
  ON CONFLICT (tenant_id,organization_id,user_id) DO UPDATE SET membership_status='active',role_code='org_admin',updated_at=now(),updated_by=v_bootstrap_id;

  INSERT INTO org.memberships (tenant_id,organization_id,user_id,role_code,granted_by,created_by,updated_by)
  SELECT v_tenant_id,v_org_id,u.id,'user',v_bootstrap_id,v_bootstrap_id,v_bootstrap_id FROM identity.users AS u WHERE u.email='user@example.test'
  ON CONFLICT (tenant_id,organization_id,user_id) DO UPDATE SET membership_status='active',role_code='user',updated_at=now(),updated_by=v_bootstrap_id;
END $$;
