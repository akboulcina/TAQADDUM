DO $$
DECLARE module_name text;
BEGIN
  FOREACH module_name IN ARRAY ARRAY['identity','org','portfolio','project','documents','gis','finance','contracts','planning','field','control','governance','performance','notifications','reporting','procurement','communication','read'] LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I._migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())', module_name);
    EXECUTE format('GRANT SELECT, INSERT ON %I._migrations TO %I', module_name, 'taq_' || module_name || '_app');
    EXECUTE format('GRANT SELECT ON %I._migrations TO %I', module_name, 'taq_' || module_name || '_ro');
  END LOOP;
END $$;
