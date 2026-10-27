import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertBanner, Button, StatusBadge, Text } from '@taqaddum/ui';
import { useTranslation, type Locale } from '@taqaddum/i18n-ui';
import '@taqaddum/design-tokens/tokens.css';
import './demo.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
type ProjectStatus = 'draft' | 'authorized' | 'archived';
type Project = { id: string; code: string; name: string; organization: string; status: ProjectStatus; updatedAt: string };
type AuditEntry = { id: string; action: string; object: string; result: string; at: string };
type AuthUser = { id: string; email: string; fullName: string; roleCode: string; roleName: string };
type Kpi = { id: string; kpi_id: string; family: string; name: string; importance: string; phase: string; unit: string; owner_role: string };
type AlertCondition = { id: string; position: number; kpi_or_field: string; operator: string; threshold: number | null };
type AlertRule = { id: string; rule_id: string; name: string; level: string; readable_condition: string; recipients: string; frequency: string; conditions: AlertCondition[] };

const initialProjects: Project[] = [
  { id: 'demo-001', code: 'PRJ-001', name: 'Programme de modernisation', organization: 'Organisation Démo', status: 'authorized', updatedAt: '2026-09-22 09:30' },
  { id: 'demo-002', code: 'PRJ-002', name: 'Réhabilitation des infrastructures', organization: 'Organisation Démo', status: 'draft', updatedAt: '2026-09-22 10:15' },
];

const initialAudit: AuditEntry[] = [
  { id: 'audit-001', action: 'Projet autorisé', object: 'PRJ-001', result: 'Succès', at: '2026-09-22 09:30' },
  { id: 'audit-002', action: 'Document vérifié', object: 'DOC-001', result: 'Succès', at: '2026-09-21 16:45' },
];

const navigation = [
  ['overview', 'Vue d’ensemble', 'Disponible'], ['portfolios', 'Portefeuilles', 'Démo'], ['projects', 'Projets', 'Disponible'], ['contracts', 'Contrats et marchés', 'À venir'], ['finance', 'Finance', 'À venir'], ['field', 'Terrain et GIS', 'Démo'], ['control', 'Centre de contrôle', 'Démo'], ['decisions', 'Décisions et actions', 'À venir'], ['reports', 'Rapports', 'Démo'], ['admin', 'Administration', 'À venir'],
] as const;

function statusLabel(status: ProjectStatus) { return { draft: 'Brouillon', authorized: 'Autorisé', archived: 'Archivé' }[status]; }
function statusTone(status: ProjectStatus) { return status === 'authorized' ? 'success' : status === 'draft' ? 'warning' : 'neutral'; }

export function Demo() {
  const { locale, setLocale, t, direction } = useTranslation('fr');
  const [apiReady, setApiReady] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [activeSection, setActiveSection] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [audit, setAudit] = useState(initialAudit);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isAuthorizeOpen, setAuthorizeOpen] = useState<Project | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newOrganization, setNewOrganization] = useState('Organisation Démo');
  const [justification, setJustification] = useState('');
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('direction@taqaddum.dz');
  const [loginPassword, setLoginPassword] = useState('Taqaddum2026!');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);

  useEffect(() => { fetch(`${apiBaseUrl}/health/ready`).then((r) => setApiReady(r.ok)).catch(() => setApiReady(false)).finally(() => setLastChecked(new Date())); }, []);
  useEffect(() => { if (!isCreateOpen) createButtonRef.current?.focus(); }, [isCreateOpen]);

  const locales: Locale[] = ['fr', 'ar', 'en'];
  const filteredProjects = useMemo(() => projects.filter((p) => `${p.code} ${p.name} ${p.organization}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || p.status === statusFilter)), [projects, query, statusFilter]);

  async function loadProjects() {
    try {
      const response = await fetch(`${apiBaseUrl}/v1/projects`, { headers: { Accept: 'application/json', 'X-Tenant-Id': '68b04727-b370-4fae-a518-a5f74280f2f8', 'X-Organization-Id': '078c5634-6903-4476-af7c-a252a713e378' } });
      if (!response.ok) throw new Error(`Impossible de charger les projets (${response.status})`);
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : payload.items ?? payload.data ?? [];
      setProjects(rows.map((project: any) => ({ id: project.id, code: project.code ?? project.projectCode ?? project.project_code, name: project.name ?? project.nameFr ?? project.name_fr, status: project.status, organization: project.organization ?? 'Organisation Démo', updatedAt: project.updatedAt ?? project.updated_at ?? new Date().toISOString() })));
    } catch (error) { console.error(error); setNotice(error instanceof Error ? error.message : 'Erreur de chargement des projets'); }
  }

  async function loadKpisAndAlerts(authToken: string) {
    const headers = { Accept: 'application/json', Authorization: `Bearer ${authToken}` };
    const kpiResponse = await fetch(`${apiBaseUrl}/v1/kpis`, { headers });
    if (kpiResponse.ok) setKpis((await kpiResponse.json()).items ?? []);
    const alertResponse = await fetch(`${apiBaseUrl}/v1/alert-rules`, { headers });
    if (alertResponse.ok) setAlertRules((await alertResponse.json()).items ?? []);
  }

  useEffect(() => { void loadProjects(); }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setLoginError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      if (!response.ok) throw new Error('Identifiants incorrects.');
      const payload = await response.json();
      setUser(payload.user); setToken(payload.token);
      setNotice(`Connexion réussie : ${payload.user.fullName} (${payload.user.roleName}).`);
      await loadProjects(); await loadKpisAndAlerts(payload.token);
    } catch (error) { setLoginError(error instanceof Error ? error.message : 'Erreur de connexion.'); }
  }

  function signOut() { setUser(null); setToken(null); setKpis([]); setAlertRules([]); }

  async function createProject() {
    const code = newCode.trim(); const name = newName.trim();
    if (!code || !name) { setNotice('Le code et le nom du projet sont obligatoires.'); return; }
    try {
      const response = await fetch(`${apiBaseUrl}/v1/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Tenant-Id': '68b04727-b370-4fae-a518-a5f74280f2f8', 'X-Organization-Id': '078c5634-6903-4476-af7c-a252a713e378', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ code, name, nameFr: name, nameAr: name, nameEn: name, organizationId: '078c5634-6903-4476-af7c-a252a713e378', description: '' }) });
      if (!response.ok) throw new Error(`Création refusée (${response.status})`);
      setNewCode(''); setNewName(''); setCreateOpen(false); setNotice('Projet créé et enregistré dans la base de données.'); await loadProjects();
    } catch (error) { console.error(error); setNotice(error instanceof Error ? error.message : 'Erreur de création du projet'); }
  }

  function authorizeProject() {
    if (!isAuthorizeOpen || !justification.trim()) { setNotice('Une justification est obligatoire.'); return; }
    const project = isAuthorizeOpen;
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, status: 'authorized', updatedAt: new Date().toLocaleString() } : item));
    setAudit((current) => [{ id: `audit-${Date.now()}`, action: 'Projet autorisé', object: project.code, result: 'Mode démonstration', at: new Date().toLocaleString() }, ...current]);
    setNotice(`Projet ${project.code} autorisé en mode démonstration.`); setJustification(''); setAuthorizeOpen(null);
  }

  if (!user) {
    return (
      <div className="app-shell" dir={direction}>
        <main className="content" style={{ maxWidth: '520px', margin: '80px auto' }}>
          <section className="panel">
            <div className="panel__header"><div><span className="eyebrow">TAQADDUM</span><Text as="h1" variant="title">Connexion</Text></div></div>
            {loginError ? <AlertBanner tone="warning">{loginError}</AlertBanner> : null}
            <form onSubmit={signIn} className="form-grid">
              <label>E-mail<input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></label>
              <label>Mot de passe<input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></label>
              <Button type="submit">Se connecter</Button>
            </form>
            <p className="muted">Comptes : direction@taqaddum.dz, pmo@taqaddum.dz, mo@taqaddum.dz, bet@taqaddum.dz, entreprise@taqaddum.dz, finance@taqaddum.dz.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell" dir={direction}>
      <header className="topbar">
        <div className="brand"><span className="brand__mark">T</span><Text as="span" variant="title">{t('app_name')}</Text></div>
        <div className="topbar__context">
          <span className="context-chip">{user.roleName}</span>
          <StatusBadge tone={apiReady ? 'success' : 'warning'}>{apiReady ? 'API connectée' : 'API indisponible'}</StatusBadge>
          <Button size="sm" variant="secondary" onClick={signOut}>Déconnexion</Button>
          <nav className="locale-switcher" aria-label="Langue">
            {locales.map((candidate) => <Button key={candidate} size="sm" variant={locale === candidate ? 'primary' : 'secondary'} aria-pressed={locale === candidate} onClick={() => setLocale(candidate)}>{candidate.toUpperCase()}</Button>)}
          </nav>
        </div>
      </header>

      <div className="shell-body">
        <aside className="sidebar" aria-label="Navigation principale">
          <div className="sidebar__heading">Modules</div>
          <nav className="sidebar__nav">
            {navigation.map(([id, label, state]) => <button key={id} type="button" className={`nav-item ${activeSection === id ? 'nav-item--active' : ''}`} onClick={() => setActiveSection(id)}><span>{label}</span><small>{state}</small></button>)}
          </nav>
          <div className="demo-note"><StatusBadge tone="info">Mode démonstration</StatusBadge><p>Connecté : {user.email}</p></div>
        </aside>

        <main className="content">
          {notice ? <AlertBanner tone="success" dismissible dismissLabel="Fermer" onDismiss={() => setNotice(null)}>{notice}</AlertBanner> : null}
          <section className="page-heading">
            <div><span className="eyebrow">TAQADDUM · Release 0</span><Text as="h1" variant="title">Vue d’ensemble</Text><p>Projets, KPI, alertes et audit dans un espace de contrôle unifié.</p></div>
          </section>

          <section className="metric-grid">
            <article className="metric-card"><span>Projets actifs</span><strong>{projects.filter((p) => p.status === 'authorized').length}</strong><small>dans la portée active</small></article>
            <article className="metric-card"><span>KPI référentiel</span><strong>{kpis.length}</strong><small>indicateurs chargés</small></article>
            <article className="metric-card"><span>Alertes</span><strong>{alertRules.length}</strong><small>règles actives</small></article>
            <article className="metric-card"><span>Audit récent</span><strong>{audit.length}</strong><small>événements</small></article>
          </section>

          <section className="content-grid">
            <article className="panel panel--wide">
              <div className="panel__header"><div><span className="eyebrow">Portefeuille</span><Text as="h2" variant="heading">Projets</Text></div><Button ref={createButtonRef} onClick={() => setCreateOpen(true)}>Créer un projet</Button></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>Nom</th><th>Statut</th><th>Organisation</th><th>Modification</th><th>Actions</th></tr></thead>
                  <tbody>{filteredProjects.map((project) => <tr key={project.id}><td><span className="code">{project.code}</span></td><td>{project.name}</td><td><StatusBadge tone={statusTone(project.status)}>{statusLabel(project.status)}</StatusBadge></td><td>{project.organization}</td><td>{project.updatedAt}</td><td>{project.status === 'draft' ? <Button size="sm" variant="secondary" onClick={() => setAuthorizeOpen(project)}>Autoriser</Button> : <span className="muted">Aucune action</span>}</td></tr>)}</tbody>
                </table>
              </div>
            </article>

            <article className="panel panel--wide">
              <div className="panel__header"><div><span className="eyebrow">Pilotage</span><Text as="h2" variant="heading">Référentiel KPI</Text></div><StatusBadge tone="info">{kpis.length} KPI</StatusBadge></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>KPI</th><th>Famille</th><th>Phase</th><th>Unité</th><th>Responsable</th></tr></thead>
                  <tbody>{kpis.map((kpi) => <tr key={kpi.id}><td><span className="code">{kpi.kpi_id}</span></td><td>{kpi.name}</td><td>{kpi.family}</td><td>{kpi.phase}</td><td>{kpi.unit}</td><td>{kpi.owner_role}</td></tr>)}</tbody>
                </table>
              </div>
            </article>

            <article className="panel panel--wide">
              <div className="panel__header"><div><span className="eyebrow">Centre de contrôle</span><Text as="h2" variant="heading">Alertes</Text></div><StatusBadge tone="warning">{alertRules.length} règles</StatusBadge></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>Alerte</th><th>Niveau</th><th>Condition</th><th>Destinataires</th><th>Fréquence</th></tr></thead>
                  <tbody>{alertRules.map((rule) => <tr key={rule.id}><td><span className="code">{rule.rule_id}</span></td><td>{rule.name}</td><td>{rule.level}</td><td>{rule.readable_condition}</td><td>{rule.recipients}</td><td>{rule.frequency}</td></tr>)}</tbody>
                </table>
              </div>
            </article>
          </section>
        </main>
      </div>

      {isCreateOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true">
            <div className="modal__header"><Text as="h2" variant="heading">Créer un projet</Text><Button size="sm" variant="secondary" onClick={() => setCreateOpen(false)}>Fermer</Button></div>
            <div className="form-grid">
              <label>Code<input value={newCode} onChange={(e) => setNewCode(e.target.value)} /></label>
              <label>Nom<input value={newName} onChange={(e) => setNewName(e.target.value)} /></label>
              <label>Organisation<input value={newOrganization} onChange={(e) => setNewOrganization(e.target.value)} /></label>
            </div>
            <div className="modal__actions"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Annuler</Button><Button onClick={createProject}>Créer</Button></div>
          </section>
        </div>
      ) : null}

      {isAuthorizeOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true">
            <Text as="h2" variant="heading">Autoriser {isAuthorizeOpen.code}</Text>
            <label>Justification<textarea value={justification} onChange={(e) => setJustification(e.target.value)} /></label>
            <div className="modal__actions"><Button variant="secondary" onClick={() => setAuthorizeOpen(null)}>Annuler</Button><Button onClick={authorizeProject}>Confirmer</Button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
