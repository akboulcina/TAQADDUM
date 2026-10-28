import type { IncomingMessage, ServerResponse } from 'node:http';
import { Client } from 'pg';
import { calculate, validateFacts } from './monitoring-engine.js';
import { authorizeOrganization } from './security-auth.js';

type Actor = { userId: string; identityUserId: string };
export function canIndependentlyValidate(
  roleCodes: string[],
  projectCanValidate: boolean,
  validatorUserId: string,
  submitterUserId: string,
): boolean {
  return (
    roleCodes.includes('CNED_PMO') &&
    !roleCodes.includes('CNED_DIRECTION') &&
    projectCanValidate &&
    validatorUserId !== submitterUserId
  );
}
export async function listAssignedMonitoringProjects(
  db: Pick<Client, 'query'>,
  tenantId: string,
  organizationId: string,
  userId: string,
) {
  const result = await db.query(
    `SELECT p.id,p.project_code AS code,p.name_fr AS name,COALESCE(m.can_submit,false) AS can_submit,COALESCE(m.can_validate,false) AS can_validate FROM project.projects p JOIN monitoring.project_members m ON m.project_id=p.id AND m.user_id=$3 WHERE p.tenant_id::text=$1 AND p.organization_id::text=$2 ORDER BY p.project_code`,
    [tenantId, organizationId, userId],
  );
  return result.rows;
}
export async function getAssignedMonitoringProject(
  db: Pick<Client, 'query'>,
  projectId: string,
  tenantId: string,
  organizationId: string,
  userId: string,
) {
  const result = await db.query(
    `SELECT p.id,COALESCE(m.can_submit,false) AS can_submit,COALESCE(m.can_validate,false) AS can_validate FROM project.projects p JOIN monitoring.project_members m ON m.project_id=p.id AND m.user_id=$4 WHERE p.id=$1 AND p.tenant_id::text=$2 AND p.organization_id::text=$3`,
    [projectId, tenantId, organizationId, userId],
  );
  return result.rows[0];
}
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reply(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}
function context(req: IncomingMessage, key: string) {
  const value = req.headers[key];
  if (typeof value !== 'string' || !uuid.test(value))
    throw new HttpError(400, `Contexte UUID requis: ${key}`);
  return value;
}
async function body(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = Buffer.from(chunk);
    size += b.length;
    if (size > 32768) throw new HttpError(413, 'Situation trop volumineuse');
    chunks.push(b);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new HttpError(400, 'Objet JSON requis');
  }
}
function dateOnly(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new HttpError(400, 'Date YYYY-MM-DD requise');
  const date = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    value > new Date().toISOString().slice(0, 10)
  )
    throw new HttpError(400, 'Date invalide ou future');
  return value;
}
export async function monitoringRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  actor: Actor | undefined,
  databaseUrl: string,
): Promise<boolean> {
  if (!pathname.startsWith('/v1/monitoring/')) return false;
  let db: Client | undefined;
  let transaction = false;
  try {
    if (!actor) throw new HttpError(401, 'Connexion requise');
    const tenant = context(req, 'x-tenant-id');
    const organization = context(req, 'x-organization-id');
    db = new Client({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      statement_timeout: 10000,
    });
    await db.connect();
    await db.query('BEGIN');
    transaction = true;
    await db.query(
      `SELECT set_config('app.tenant_id',$1,true),set_config('app.organization_id',$2,true)`,
      [tenant, organization],
    );
    if (!(await authorizeOrganization(db, actor.identityUserId, tenant, organization)))
      throw new HttpError(403, 'Membership actif requis dans cette organisation');
    const roles = (
      await db.query(
        `SELECT r.code FROM public.users u JOIN public.user_roles ur ON ur.user_id=u.id JOIN public.roles r ON r.id=ur.role_id WHERE u.id=$1 AND u.is_active=true`,
        [actor.userId],
      )
    ).rows.map((r: { code: string }) => r.code);
    if (!roles.length) throw new HttpError(403, 'Compte inactif ou sans rôle');
    const director = roles.includes('CNED_DIRECTION');
    const mo = roles.includes('MO');
    const pmo = roles.includes('CNED_PMO');
    if (!director && !mo && !pmo)
      throw new HttpError(403, 'Ce pilote est réservé au MO, à la PMO et à la Direction');
    if (req.method === 'GET' && pathname === '/v1/monitoring/projects') {
      const rows = await listAssignedMonitoringProjects(db, tenant, organization, actor.userId);
      reply(res, 200, {
        items: rows.map((r: any) => ({
          ...r,
          can_submit: !director && mo && r.can_submit,
          can_validate: !director && pmo && r.can_validate,
        })),
      });
      return true;
    }
    const match =
      /^\/v1\/monitoring\/projects\/([0-9a-f-]+)\/(updates|results)(?:\/([0-9a-f-]+)\/validate)?$/i.exec(
        pathname,
      );
    if (!match) throw new HttpError(404, 'Route de suivi inconnue');
    const projectId = match[1]!;
    const resource = match[2]!;
    const updateId = match[3];
    if (!uuid.test(projectId) || (updateId && !uuid.test(updateId)))
      throw new HttpError(400, 'Identifiant UUID invalide');
    const access = await getAssignedMonitoringProject(
      db,
      projectId,
      tenant,
      organization,
      actor.userId,
    );
    if (!access) throw new HttpError(404, 'Projet absent ou non affecté');
    if (resource === 'updates' && !updateId && req.method === 'POST') {
      if (director || !mo || !access.can_submit)
        throw new HttpError(403, 'Droit de saisie MO requis sur ce projet');
      const input = await body(req);
      const referenceDate = dateOnly(input.referenceDate);
      let facts;
      try {
        facts = validateFacts(input.sourceData);
      } catch (e) {
        throw new HttpError(400, e instanceof Error ? e.message : 'Données invalides');
      }
      if (!Object.keys(facts).length)
        throw new HttpError(400, 'Au moins une donnée source requise');
      if (typeof input.comment !== 'string' || !input.comment.trim() || input.comment.length > 4000)
        throw new HttpError(400, 'Commentaire de 1 à 4000 caractères requis');
      const row = await db.query(
        `INSERT INTO monitoring.project_updates(project_id,submitted_by,reference_date,source_data,comment) VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING id,status,reference_date,created_at`,
        [projectId, actor.userId, referenceDate, JSON.stringify(facts), input.comment.trim()],
      );
      await db.query('COMMIT');
      transaction = false;
      reply(res, 201, row.rows[0]);
      return true;
    }
    if (resource === 'updates' && !updateId && req.method === 'GET') {
      if (director)
        throw new HttpError(
          403,
          'La Direction consulte les résultats validés, pas les soumissions brutes',
        );
      const rows = await db.query(
        `SELECT id,submitted_by,reference_date,source_data,comment,status,validated_by,validated_at,created_at FROM monitoring.project_updates WHERE project_id=$1 ORDER BY reference_date DESC,created_at DESC LIMIT 100`,
        [projectId],
      );
      reply(res, 200, { items: rows.rows });
      return true;
    }
    if (resource === 'updates' && updateId && req.method === 'POST') {
      if (director || !pmo || !access.can_validate)
        throw new HttpError(403, 'Droit de validation PMO requis sur ce projet');
      const update = (
        await db.query(
          `SELECT * FROM monitoring.project_updates WHERE id=$1 AND project_id=$2 FOR UPDATE`,
          [updateId, projectId],
        )
      ).rows[0];
      if (!update) throw new HttpError(404, 'Situation introuvable');
      if (!canIndependentlyValidate(roles, access.can_validate, actor.userId, update.submitted_by))
        throw new HttpError(403, 'Validation indépendante PMO requise');
      if (update.status !== 'submitted') throw new HttpError(409, 'Situation déjà traitée');
      const referenceDate =
        update.reference_date instanceof Date
          ? update.reference_date.toISOString().slice(0, 10)
          : String(update.reference_date).slice(0, 10);
      const ageDays = Math.floor(
        (Date.now() - Date.parse(`${referenceDate}T00:00:00Z`)) / 86400000,
      );
      if (ageDays > 31)
        throw new HttpError(
          422,
          'Pilote: seules les situations de 31 jours ou moins peuvent être validées',
        );
      const calculated = calculate(update.source_data);
      const defs = (
        await db.query(`SELECT id,kpi_id FROM public.kpis WHERE kpi_id=ANY($1::text[])`, [
          Object.keys(calculated.kpis),
        ])
      ).rows;
      if (defs.length !== 5)
        throw new HttpError(409, 'Référentiel incomplet pour les cinq KPI du pilote');
      for (const def of defs) {
        const value = calculated.kpis[def.kpi_id]!;
        await db.query(
          `INSERT INTO monitoring.kpi_results(update_id,kpi_id,value,status,explanation,calculation_version) VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            updateId,
            def.id,
            value.value,
            value.status,
            value.explanation,
            calculated.calculationVersion,
          ],
        );
      }
      for (const [code, evaluation] of Object.entries(calculated.alerts)) {
        if (evaluation.triggered !== true) continue;
        const rule = (
          await db.query(`SELECT id FROM public.alert_rules WHERE rule_id=$1 AND is_active=true`, [
            code,
          ])
        ).rows[0];
        if (!rule) throw new HttpError(409, `Règle manquante ou désactivée: ${code}`);
        await db.query(
          `INSERT INTO monitoring.alert_events(update_id,rule_id,evidence) VALUES ($1,$2,$3::jsonb)`,
          [
            updateId,
            rule.id,
            JSON.stringify({
              calculationVersion: calculated.calculationVersion,
              referenceDate,
              sourceData: update.source_data,
              kpis: calculated.kpis,
              explanation: evaluation.explanation,
              thresholdsProvisional: true,
              freshnessPolicy: 'pilot-31-days',
            }),
          ],
        );
      }
      await db.query(
        `UPDATE monitoring.project_updates SET status='validated',validated_by=$2,validated_at=now() WHERE id=$1`,
        [updateId, actor.userId],
      );
      await db.query('COMMIT');
      transaction = false;
      reply(res, 200, {
        id: updateId,
        status: 'validated',
        calculationVersion: calculated.calculationVersion,
      });
      return true;
    }
    if (resource === 'results' && !updateId && req.method === 'GET') {
      const latest = (
        await db.query(
          `SELECT id,reference_date,validated_at FROM monitoring.project_updates WHERE project_id=$1 AND status='validated' ORDER BY reference_date DESC,validated_at DESC LIMIT 1`,
          [projectId],
        )
      ).rows[0];
      if (!latest) {
        reply(res, 200, { snapshot: null, kpis: [], alerts: [] });
        return true;
      }
      const visible = director ? ['AV2', 'DL2', 'QR1'] : ['AV1', 'AV2', 'DL1', 'DL2', 'QR1'];
      const kpis = await db.query(
        `SELECT k.kpi_id AS code,k.name,k.unit,r.value,r.status,r.explanation,r.calculation_version FROM monitoring.kpi_results r JOIN public.kpis k ON k.id=r.kpi_id WHERE r.update_id=$1 AND k.kpi_id=ANY($2::text[]) ORDER BY k.kpi_id`,
        [latest.id, visible],
      );
      const alerts = await db.query(
        `SELECT e.id,a.rule_id AS code,a.name,a.level,a.action,e.state,e.created_at FROM monitoring.alert_events e JOIN public.alert_rules a ON a.id=e.rule_id WHERE e.update_id=$1 AND a.rule_id=ANY($2::text[]) ORDER BY a.rule_id`,
        [latest.id, ['AL02', 'AL06', 'AL13']],
      );
      reply(res, 200, {
        snapshot: latest,
        kpis: kpis.rows,
        alerts: alerts.rows,
        thresholdsProvisional: true,
      });
      return true;
    }
    throw new HttpError(405, 'Méthode non autorisée');
  } catch (e) {
    if (transaction && db) {
      try {
        await db.query('ROLLBACK');
      } catch {}
    }
    if (e instanceof HttpError) reply(res, e.status, { detail: e.message });
    else {
      console.error('Monitoring error', e);
      reply(res, 500, {
        detail: 'Suivi indisponible; vérifier la migration et les journaux du backend',
      });
    }
    return true;
  } finally {
    if (db) {
      try {
        await db.end();
      } catch {}
    }
  }
}
