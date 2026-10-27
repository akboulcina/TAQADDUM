-- Optional private-demo setup only. Run after the monitoring migration.
BEGIN;
DO $$
DECLARE p uuid; mo_user uuid; pmo_user uuid;
BEGIN
  SELECT id INTO p FROM project.projects WHERE id='2d5bfd77-c6d7-4f0e-bf5a-de2e1056cf81' AND project_code='0052' AND tenant_id::text='68b04727-b370-4fae-a518-a5f74280f2f8' AND organization_id::text='078c5634-6903-4476-af7c-a252a713e378';
  SELECT u.id INTO mo_user FROM public.users u WHERE u.email='mo@taqaddum.dz' AND u.is_active AND EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.code='MO');
  SELECT u.id INTO pmo_user FROM public.users u WHERE u.email='pmo@taqaddum.dz' AND u.is_active AND EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.code='CNED_PMO');
  IF p IS NULL OR mo_user IS NULL OR pmo_user IS NULL OR mo_user=pmo_user THEN RAISE EXCEPTION 'Projet 0052 ou comptes MO/PMO attendus absents; aucune affectation créée'; END IF;
  INSERT INTO monitoring.project_members(project_id,user_id,can_submit,can_validate) VALUES(p,mo_user,true,false),(p,pmo_user,false,true) ON CONFLICT(project_id,user_id) DO NOTHING;
END $$;
COMMIT;
