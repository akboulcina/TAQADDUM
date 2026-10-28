-- Forward-only addition. Does not replace login or provision any account.
-- Apply only through an approved migration procedure; never replay legacy SQL.
-- The function owner must be a trusted migration role able to read the identity
-- tables across RLS. Runtime roles must not own or replace this function.
CREATE OR REPLACE FUNCTION identity.authenticate_workspace_user(
  p_email text,
  p_password text,
  p_session_token_hash text
)
RETURNS TABLE (
  public_user_id uuid,
  identity_user_id uuid,
  email text,
  full_name text,
  contexts jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  WITH credential_candidates AS (
    SELECT u.id,u.email,u.full_name
    FROM public.users u
    WHERE lower(u.email)=lower(p_email)
      AND u.is_active=true
      AND u.password_hash=public.crypt(p_password,u.password_hash)
      AND p_session_token_hash ~ '^[0-9a-f]{64}$'
  ), credential AS (
    SELECT c.* FROM credential_candidates c
    WHERE (SELECT count(*) FROM credential_candidates)=1
  ), linked AS (
    SELECT c.id AS public_user_id,c.email,c.full_name,i.id AS identity_user_id
    FROM credential c
    JOIN identity.auth_user_links l ON l.public_user_id=c.id
    JOIN identity.users i ON i.id=l.identity_user_id AND i.is_active=true
  ), scoped AS (
    SELECT l.public_user_id,l.email,l.full_name,l.identity_user_id,
      jsonb_agg(jsonb_build_object(
        'tenantId',t.id,
        'tenantCode',t.tenant_code,
        'tenantName',t.name_fr,
        'organizationId',o.id,
        'organizationCode',o.organization_code,
        'organizationName',o.name_fr,
        'roleCode',m.role_code,
        'roleName',COALESCE(r.name_fr,m.role_code),
        'permissions',COALESCE((
          SELECT jsonb_agg(DISTINCT p.permission_code ORDER BY p.permission_code)
          FROM identity.roles permission_role
          JOIN identity.role_permissions rp ON rp.role_id=permission_role.id
          JOIN identity.permissions p ON p.id=rp.permission_id
          WHERE permission_role.role_code=m.role_code
        ),'[]'::jsonb)
      ) ORDER BY t.tenant_code,o.organization_code,m.role_code) AS contexts
    FROM linked l
    JOIN org.memberships m ON m.user_id=l.identity_user_id
      AND m.membership_status='active'
      AND (m.expires_at IS NULL OR m.expires_at>now())
    JOIN org.tenants t ON t.id=m.tenant_id AND t.status='active'
    JOIN org.organizations o ON o.id=m.organization_id
      AND o.tenant_id=m.tenant_id AND o.status='active'
    LEFT JOIN identity.roles r ON r.role_code=m.role_code
    GROUP BY l.public_user_id,l.email,l.full_name,l.identity_user_id
  ), created AS (
    INSERT INTO identity.sessions (user_id,session_token_hash,expires_at)
    SELECT s.identity_user_id,p_session_token_hash,now()+interval '8 hours'
    FROM scoped s
    WHERE jsonb_array_length(s.contexts)>0
    RETURNING user_id
  )
  SELECT s.public_user_id,s.identity_user_id,s.email,s.full_name,s.contexts
  FROM scoped s
  JOIN created c ON c.user_id=s.identity_user_id
$function$;
REVOKE ALL ON FUNCTION identity.authenticate_workspace_user(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.authenticate_workspace_user(text,text,text) TO taq_identity_app;
-- Recovery: leave this unused function in place or, after reviewing dependencies,
-- remove this exact function in a separate approved forward migration. No data
-- backfill or destructive down migration is supplied.
