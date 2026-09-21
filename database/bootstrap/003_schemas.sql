DO $$
DECLARE module_name text;
BEGIN
  FOREACH module_name IN ARRAY ARRAY['identity','org','portfolio','project','documents','audit','platform','gis','finance','contracts','planning','field','control','governance','performance','notifications','reporting','procurement','communication','read'] LOOP
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', module_name);
    EXECUTE format('ALTER SCHEMA %I OWNER TO %I', module_name, 'taq_' || module_name || '_owner');
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', module_name);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', module_name, 'taq_' || module_name || '_app');
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', module_name, 'taq_' || module_name || '_ro');
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I REVOKE ALL ON TABLES FROM PUBLIC', 'taq_' || module_name || '_owner', module_name);
  END LOOP;
END $$;
