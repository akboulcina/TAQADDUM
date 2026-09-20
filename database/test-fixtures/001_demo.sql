INSERT INTO org.tenants (id, tenant_code, name_fr, name_ar, name_en) VALUES (platform.uuid_v7(), 'demo-tenant', 'Démo', 'تجريبي', 'Demo') ON CONFLICT (tenant_code) DO NOTHING;
