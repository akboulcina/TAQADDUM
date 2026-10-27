BEGIN;
CREATE SCHEMA IF NOT EXISTS monitoring;
CREATE TABLE IF NOT EXISTS monitoring.project_members (
  project_id uuid NOT NULL REFERENCES project.projects(id),
  user_id uuid NOT NULL REFERENCES public.users(id),
  can_submit boolean NOT NULL DEFAULT false,
  can_validate boolean NOT NULL DEFAULT false,
  PRIMARY KEY (project_id, user_id)
);
CREATE TABLE IF NOT EXISTS monitoring.project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES project.projects(id),
  submitted_by uuid NOT NULL REFERENCES public.users(id),
  reference_date date NOT NULL,
  source_data jsonb NOT NULL CHECK (jsonb_typeof(source_data) = 'object'),
  comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','validated','rejected')),
  validated_by uuid REFERENCES public.users(id),
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'validated' AND validated_by IS NOT NULL AND validated_at IS NOT NULL AND validated_by <> submitted_by) OR (status <> 'validated' AND validated_by IS NULL AND validated_at IS NULL))
);
CREATE INDEX IF NOT EXISTS project_updates_history ON monitoring.project_updates(project_id, reference_date DESC, created_at DESC);
CREATE TABLE IF NOT EXISTS monitoring.kpi_results (
  update_id uuid NOT NULL REFERENCES monitoring.project_updates(id),
  kpi_id uuid NOT NULL REFERENCES public.kpis(id),
  value numeric,
  status text NOT NULL CHECK (status IN ('green','orange','red','information','not_calculable')),
  explanation text NOT NULL,
  calculation_version text NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (update_id, kpi_id),
  CHECK ((status = 'not_calculable' AND value IS NULL) OR (status <> 'not_calculable' AND value IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS monitoring.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL REFERENCES monitoring.project_updates(id),
  rule_id uuid NOT NULL REFERENCES public.alert_rules(id),
  evidence jsonb NOT NULL CHECK (jsonb_typeof(evidence) = 'object'),
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('open','acknowledged','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (update_id, rule_id)
);
COMMIT;
