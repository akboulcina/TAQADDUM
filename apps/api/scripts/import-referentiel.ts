import { Client } from 'pg';
import { createRequire } from 'module';
import * as path from 'path';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const file = path.resolve(process.cwd(), '../../database/seed/TAQADDUM_import_ready.xlsx');

const workbook = XLSX.readFile(file);

const users = XLSX.utils.sheet_to_json(workbook.Sheets['Users']);
const roles = XLSX.utils.sheet_to_json(workbook.Sheets['Roles']);
const kpis = XLSX.utils.sheet_to_json(workbook.Sheets['KPI']);
const alertRules = XLSX.utils.sheet_to_json(workbook.Sheets['AlertRules']);
const alertConditions = XLSX.utils.sheet_to_json(workbook.Sheets['AlertConditions']);

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl?.trim()) {
    throw new Error('DATABASE_URL is required');
  }
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  for (const r of roles) {
    await client.query(
      `INSERT INTO roles (code, name, data_scope)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         data_scope = EXCLUDED.data_scope`,
      [r.role_code, r.role_name, r.data_scope],
    );
  }

  for (const u of users) {
    const role = await client.query('SELECT id FROM roles WHERE code = $1', [u.role_code]);

    if (role.rowCount === 0) continue;

    const user = await client.query(
      `INSERT INTO users (email, full_name, password_hash, is_active)
       VALUES ($1, $2, crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')), false)
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name
       RETURNING id`,
      [u.email, u.full_name],
    );

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [user.rows[0].id, role.rows[0].id],
    );
  }

  for (const k of kpis) {
    await client.query(
      `INSERT INTO kpis (
        kpi_id, family, name, importance, phase, calculability, definition, formula,
        unit, direction, green_threshold, red_threshold, green_label, orange_label,
        red_label, data_source, owner_role, target_frequency, source_tables, justification
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )
      ON CONFLICT (kpi_id) DO UPDATE SET
        family = EXCLUDED.family,
        name = EXCLUDED.name,
        importance = EXCLUDED.importance,
        phase = EXCLUDED.phase,
        calculability = EXCLUDED.calculability,
        definition = EXCLUDED.definition,
        formula = EXCLUDED.formula,
        unit = EXCLUDED.unit,
        direction = EXCLUDED.direction,
        green_threshold = EXCLUDED.green_threshold,
        red_threshold = EXCLUDED.red_threshold,
        green_label = EXCLUDED.green_label,
        orange_label = EXCLUDED.orange_label,
        red_label = EXCLUDED.red_label,
        data_source = EXCLUDED.data_source,
        owner_role = EXCLUDED.owner_role,
        target_frequency = EXCLUDED.target_frequency,
        source_tables = EXCLUDED.source_tables,
        justification = EXCLUDED.justification`,
      [
        k.KPI_ID,
        k.Famille,
        k.Nom_KPI,
        k.Importance,
        k.Phase,
        k.Calculabilité,
        k.Définition,
        k.Formule,
        k.Unité,
        k.Sens,
        toNumber(k.Seuil_Vert),
        toNumber(k.Seuil_Rouge),
        k.Vert,
        k.Orange,
        k.Rouge,
        k.Alimenté_par,
        k.Responsable,
        k.Fréquence_cible,
        k.Tables_sources,
        k.Justification_importance,
      ],
    );
  }

  for (const a of alertRules) {
    const result = await client.query(
      `INSERT INTO alert_rules (
        rule_id, name, level, importance, phase, readable_condition, logic,
        recipients, action, frequency, origin, change_note
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (rule_id) DO UPDATE SET
        name = EXCLUDED.name,
        level = EXCLUDED.level,
        importance = EXCLUDED.importance,
        phase = EXCLUDED.phase,
        readable_condition = EXCLUDED.readable_condition,
        logic = EXCLUDED.logic,
        recipients = EXCLUDED.recipients,
        action = EXCLUDED.action,
        frequency = EXCLUDED.frequency,
        origin = EXCLUDED.origin,
        change_note = EXCLUDED.change_note
      RETURNING id`,
      [
        a.Regle_ID,
        a.Nom,
        a.Niveau,
        a.Importance,
        a.Phase,
        a['Condition (lisible)'],
        a.Logique,
        a.Destinataire,
        a.Action,
        a.Fréquence,
        a.Origine,
        a["Changement par rapport à l'ancienne règle"],
      ],
    );

    const alertId = result.rows[0].id;

    await client.query('DELETE FROM alert_conditions WHERE alert_rule_id = $1', [alertId]);
  }

  for (const c of alertConditions) {
    const rule = await client.query('SELECT id FROM alert_rules WHERE rule_id = $1', [c.Regle_ID]);

    if (rule.rowCount === 0) continue;

    await client.query(
      `INSERT INTO alert_conditions
        (alert_rule_id, position, kpi_or_field, operator, threshold)
       VALUES ($1, $2, $3, $4, $5)`,
      [rule.rows[0].id, c.position, c.kpi_ou_champ, c.operateur, toNumber(c.seuil)],
    );
  }

  const counts = await client.query(`
    SELECT
      (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM roles) AS roles,
      (SELECT count(*) FROM kpis) AS kpis,
      (SELECT count(*) FROM alert_rules) AS alert_rules,
      (SELECT count(*) FROM alert_conditions) AS alert_conditions
  `);

  console.log(counts.rows[0]);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
