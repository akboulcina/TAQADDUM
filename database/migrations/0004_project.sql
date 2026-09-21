CREATE SCHEMA IF NOT EXISTS project;

CREATE TABLE IF NOT EXISTS project.projects (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  project_code text NOT NULL,
  name_fr text,
  name_ar text,
  name_en text,
  description_fr text,
  description_ar text,
  description_en text,
  status text NOT NULL,
  authorized_at timestamptz,
  authorized_by uuid,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  archived_at timestamptz,
  archived_by uuid,
  CONSTRAINT ck_projects__status
    CHECK (status IN ('draft', 'authorized', 'archived')),
  CONSTRAINT ck_projects__name_present
    CHECK (
      COALESCE(
        NULLIF(btrim(name_fr), ''),
        NULLIF(btrim(name_ar), ''),
        NULLIF(btrim(name_en), '')
      ) IS NOT NULL
    ),
  CONSTRAINT ck_projects__authorized_consistency
    CHECK (
      (
        status = 'authorized'
        AND authorized_at IS NOT NULL
        AND authorized_by IS NOT NULL
      )
      OR status <> 'authorized'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_projects__tenant_id__project_code
  ON project.projects (tenant_id, project_code)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_projects__tenant_id__status__updated_at
  ON project.projects (tenant_id, status, updated_at DESC)
  WHERE archived_at IS NULL;

ALTER TABLE project.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_tenant_context ON project.projects;

CREATE POLICY projects_tenant_context
  ON project.projects
  FOR ALL
  USING (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    NULLIF(current_setting('app.tenant_id', true), '') IS NOT NULL
    AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
