SELECT n.nspname AS schema_name, r.rolname AS owner_name
FROM pg_namespace n JOIN pg_roles r ON r.oid = n.nspowner
WHERE n.nspname IN ('identity','org','portfolio','project','documents','audit','platform','gis','finance','contracts','planning','field','control','governance','performance','notifications','reporting','procurement','communication','read')
ORDER BY n.nspname;
SELECT rolname FROM pg_roles WHERE rolname LIKE 'taq_%' ORDER BY rolname;
SELECT n.nspname, has_schema_privilege(r.rolname, n.oid, 'CREATE') AS can_create
FROM pg_namespace n CROSS JOIN pg_roles r
WHERE n.nspname IN ('identity','org','portfolio','project','documents','audit','platform','gis','finance','contracts','planning','field','control','governance','performance','notifications','reporting','procurement','communication','read')
AND r.rolname LIKE 'taq_%_app';
