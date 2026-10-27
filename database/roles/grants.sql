DO $$
DECLARE module_name text;
BEGIN
  FOREACH module_name IN ARRAY ARRAY['identity','org','portfolio','project','documents','audit','platform','gis','finance','contracts','planning','field','control','governance','performance','notifications','reporting','procurement','communication','read'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA %I TO %I', module_name, 'taq_' || module_name || '_app');
    EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO %I', module_name, 'taq_' || module_name || '_ro');
  END LOOP;
  REVOKE CREATE ON SCHEMA public FROM PUBLIC;
END $$;
