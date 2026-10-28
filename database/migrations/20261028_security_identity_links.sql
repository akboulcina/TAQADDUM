CREATE TABLE IF NOT EXISTS identity.auth_user_links (
  public_user_id uuid PRIMARY KEY,
  identity_user_id uuid NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_auth_user_links__identity_user UNIQUE (identity_user_id)
);

GRANT SELECT ON identity.auth_user_links, identity.users, identity.roles,
  identity.permissions, identity.role_permissions TO taq_identity_app;
GRANT SELECT, INSERT, UPDATE ON identity.sessions TO taq_identity_app;
GRANT SELECT ON org.tenants, org.organizations, org.memberships TO taq_identity_app;
GRANT SELECT ON identity.auth_user_links TO taq_identity_ro;
GRANT SELECT (id,email,full_name,password_hash,is_active) ON public.users TO taq_identity_app;
GRANT SELECT ON public.user_roles, public.roles TO taq_identity_app;
GRANT USAGE ON SCHEMA project, monitoring TO taq_identity_app;
GRANT SELECT, INSERT ON project.projects TO taq_identity_app;
GRANT SELECT ON monitoring.project_members TO taq_identity_app;

ALTER TABLE identity.auth_user_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS identity_users_tenant_context ON identity.users;
DROP POLICY IF EXISTS identity_users_membership_scope ON identity.users;
CREATE POLICY identity_users_membership_scope ON identity.users
  USING (EXISTS (
    SELECT 1 FROM org.memberships m
    WHERE m.user_id=identity.users.id
      AND m.tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
      AND m.organization_id=NULLIF(current_setting('app.organization_id',true),'')::uuid
      AND m.membership_status='active'
      AND (m.expires_at IS NULL OR m.expires_at>now())
  ));
DROP POLICY IF EXISTS auth_user_links_membership_scope ON identity.auth_user_links;
CREATE POLICY auth_user_links_membership_scope ON identity.auth_user_links
  USING (EXISTS (
    SELECT 1 FROM org.memberships m
    WHERE m.user_id=identity_user_id
      AND m.tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
      AND m.organization_id=NULLIF(current_setting('app.organization_id',true),'')::uuid
      AND m.membership_status='active'
      AND (m.expires_at IS NULL OR m.expires_at>now())
  ));