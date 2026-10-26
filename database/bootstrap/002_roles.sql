DO $$
DECLARE module_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taq_migrator') THEN CREATE ROLE taq_migrator NOLOGIN;
  END IF;
  FOREACH module_name IN ARRAY ARRAY['identity','org','portfolio','project','documents','audit','platform','gis','finance','contracts','planning','field','control','governance','performance','notifications','reporting','procurement','communication','read'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taq_' || module_name || '_owner') THEN EXECUTE format('CREATE ROLE %I NOLOGIN', 'taq_' || module_name || '_owner'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taq_' || module_name || '_app') THEN EXECUTE format('CREATE ROLE %I NOLOGIN', 'taq_' || module_name || '_app'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taq_' || module_name || '_ro') THEN EXECUTE format('CREATE ROLE %I NOLOGIN', 'taq_' || module_name || '_ro'); END IF;
  END LOOP;
END $$;
GRANT taq_migrator TO CURRENT_USER;
