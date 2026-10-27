CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  data_scope TEXT NOT NULL DEFAULT 'assigned_projects',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id TEXT UNIQUE NOT NULL,
  family TEXT NOT NULL,
  name TEXT NOT NULL,
  importance TEXT NOT NULL,
  phase TEXT NOT NULL,
  calculability TEXT NOT NULL,
  definition TEXT,
  formula TEXT,
  unit TEXT,
  direction TEXT,
  green_threshold NUMERIC,
  red_threshold NUMERIC,
  green_label TEXT,
  orange_label TEXT,
  red_label TEXT,
  data_source TEXT,
  owner_role TEXT,
  target_frequency TEXT,
  source_tables TEXT,
  justification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  importance TEXT NOT NULL,
  phase TEXT NOT NULL,
  readable_condition TEXT NOT NULL,
  logic TEXT NOT NULL,
  recipients TEXT,
  action TEXT,
  frequency TEXT,
  origin TEXT,
  change_note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  position INT NOT NULL,
  kpi_or_field TEXT NOT NULL,
  operator TEXT NOT NULL,
  threshold NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_kpi_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('R','S','V')),
  PRIMARY KEY (role_id, kpi_id)
);

CREATE TABLE IF NOT EXISTS role_alert_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('D','I')),
  PRIMARY KEY (role_id, alert_rule_id)
);

INSERT INTO roles (code, name, data_scope) VALUES
  ('CNED_DIRECTION', 'Direction CNED — décideur', 'national_portfolio'),
  ('CNED_PMO', 'CNED / PMO — analyste', 'national_portfolio'),
  ('MO', 'Maître d''ouvrage', 'assigned_projects'),
  ('BET', 'Bureau d''études / contrôle', 'assigned_projects'),
  ('CONTRACTOR', 'Contractant — entreprise', 'own_contracts'),
  ('FINANCE', 'Contrôleur budgétaire', 'financial_data')
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (email, full_name, password_hash) VALUES
  ('direction@taqaddum.dz', 'Direction CNED', crypt('Taqaddum2026!', gen_salt('bf'))),
  ('pmo@taqaddum.dz', 'CNED / PMO', crypt('Taqaddum2026!', gen_salt('bf'))),
  ('mo@taqaddum.dz', 'Maître d''ouvrage', crypt('Taqaddum2026!', gen_salt('bf'))),
  ('bet@taqaddum.dz', 'Bureau d''études', crypt('Taqaddum2026!', gen_salt('bf'))),
  ('entreprise@taqaddum.dz', 'Contractant', crypt('Taqaddum2026!', gen_salt('bf'))),
  ('finance@taqaddum.dz', 'Contrôleur budgétaire', crypt('Taqaddum2026!', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = CASE u.email
  WHEN 'direction@taqaddum.dz' THEN 'CNED_DIRECTION'
  WHEN 'pmo@taqaddum.dz' THEN 'CNED_PMO'
  WHEN 'mo@taqaddum.dz' THEN 'MO'
  WHEN 'bet@taqaddum.dz' THEN 'BET'
  WHEN 'entreprise@taqaddum.dz' THEN 'CONTRACTOR'
  WHEN 'finance@taqaddum.dz' THEN 'FINANCE'
END
ON CONFLICT DO NOTHING;
