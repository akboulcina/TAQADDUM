import { useMemo, useState } from 'react';
import './AlertsModule.css';

const SEVERITY_LABELS = { critical: 'Critique', high: 'Élevée', medium: 'Moyenne', low: 'Faible' };
const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
const SEVERITY_COLORS = { critical: '#B42318', high: '#D97706', medium: '#2F80ED', low: '#4B5565' };
const ACTION_LABELS = { open: 'Ouverte', acknowledged: 'Prise en charge', resolved: 'Résolue', dismissed: 'Écartée' };

const number = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

function normalizeProject(project) {
  if (!project) return null;
  return { id: project.id ?? project.code ?? project.name, name: project.name ?? project.title ?? 'Projet', wilaya: project.wilaya ?? 'Non renseignée', status: project.status ?? 'onTrack', progress: number(project.progress) ?? 0, budget: number(project.budget), committed: number(project.committed) ?? number(project.budget), paid: number(project.paid) ?? 0, dueDate: project.dueDate ?? null };
}

function buildDerivedAlerts(projects) {
  const today = new Date();
  const derived = [];
  projects.forEach((project) => {
    if (project.dueDate && project.status !== 'completed' && new Date(project.dueDate) < today) {
      derived.push({ id: `${project.id}-overdue`, severity: 'critical', type: 'Échéance dépassée', title: `Échéance dépassée — ${project.name}`, detail: `L’échéance contractuelle était le ${project.dueDate}.`, projectId: project.id, date: project.dueDate });
    }
    if (project.committed && project.paid > project.committed) {
      derived.push({ id: `${project.id}-budget`, severity: 'high', type: 'Dépassement budgétaire', title: `Dépassement de paiements — ${project.name}`, detail: 'Les paiements enregistrés dépassent le montant engagé.', projectId: project.id, date: today.toISOString().slice(0, 10) });
    }
    if (project.progress < 45 && project.status !== 'completed') {
      derived.push({ id: `${project.id}-stalled`, severity: 'medium', type: 'Projet ralenti', title: `Avancement faible — ${project.name}`, detail: `L’avancement physique est de ${project.progress}%.`, projectId: project.id, date: today.toISOString().slice(0, 10) });
    }
    if (project.status === 'atRisk') {
      derived.push({ id: `${project.id}-report`, severity: 'low', type: 'Rapport manquant', title: `Rapport d’avancement attendu — ${project.name}`, detail: 'Le rapport périodique n’a pas été transmis.', projectId: project.id, date: today.toISOString().slice(0, 10) });
    }
  });
  return derived;
}

export function AlertsModule({ alerts = [], projects = [], user }) {
  const [actionState, setActionState] = useState({});
  const [severity, setSeverity] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [wilayaFilter, setWilayaFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('severity');
  const [selectedId, setSelectedId] = useState(null);

  const normalizedProjects = useMemo(() => projects.map(normalizeProject).filter(Boolean), [projects]);
  const projectById = useMemo(() => new Map(normalizedProjects.map((project) => [project.id, project])), [normalizedProjects]);

  const allAlerts = useMemo(() => {
    const supplied = alerts.map((alert, index) => ({ id: alert.id ?? `alert-${index}`, severity: alert.severity ?? 'medium', type: alert.type ?? 'Alerte projet', title: alert.title ?? 'Alerte', detail: alert.detail ?? '', projectId: alert.project ?? alert.projectId ?? null, date: alert.date ?? null }));
    const derived = buildDerivedAlerts(normalizedProjects);
    const seen = new Set(supplied.map((alert) => alert.id));
    return [...supplied, ...derived.filter((alert) => !seen.has(alert.id))];
  }, [alerts, normalizedProjects]);

  const wilayas = useMemo(() => [...new Set(normalizedProjects.map((project) => project.wilaya))].sort(), [normalizedProjects]);
  const types = useMemo(() => [...new Set(allAlerts.map((alert) => alert.type))].sort(), [allAlerts]);

  const visible = useMemo(() => allAlerts
    .map((alert) => ({ ...alert, state: actionState[alert.id] ?? 'open', project: projectById.get(alert.projectId) ?? null }))
    .filter((alert) => (severity === 'all' || alert.severity === severity) &&
      (statusFilter === 'all' || alert.state === statusFilter) &&
      (wilayaFilter === 'all' || alert.project?.wilaya === wilayaFilter) &&
      (typeFilter === 'all' || alert.type === typeFilter) &&
      (!search || `${alert.title} ${alert.detail} ${alert.project?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => sort === 'severity' ? SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] : String(b.date ?? '').localeCompare(String(a.date ?? ''))),
  [allAlerts, actionState, projectById, severity, statusFilter, wilayaFilter, typeFilter, search, sort]);

  const selected = visible.find((alert) => alert.id === selectedId) ?? visible[0] ?? null;
  const counts = useMemo(() => allAlerts.reduce((accumulator, alert) => { const state = actionState[alert.id] ?? 'open'; accumulator[state] = (accumulator[state] ?? 0) + 1; return accumulator; }, { open: 0, acknowledged: 0, resolved: 0, dismissed: 0 }), [allAlerts, actionState]);

  const update = (id, state) => setActionState((current) => ({ ...current, [id]: state }));

  return (
    <section className="alerts-module" aria-label="Alertes et risques">
      <header className="alerts-header">
        <div>
          <p className="alerts-brand">TAQADDUM</p>
          <h2>Alertes & Risques</h2>
          <p>Centre opérationnel de suivi des alertes — {user?.name ?? 'Utilisateur de démonstration'}.</p>
        </div>
        <span className="alerts-demo-badge">Alertes de démonstration</span>
      </header>

      <div className="alerts-summary">
        {Object.entries(ACTION_LABELS).map(([state, label]) => <article key={state}><strong>{counts[state] ?? 0}</strong><span>{label}</span></article>)}
      </div>

      <div className="alerts-toolbar">
        <input type="search" placeholder="Rechercher une alerte, un projet…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">Toutes priorités</option>{Object.entries(SEVERITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tous les états</option>{Object.entries(ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={wilayaFilter} onChange={(event) => setWilayaFilter(event.target.value)}><option value="all">Toutes wilayas</option>{wilayas.map((wilaya) => <option key={wilaya} value={wilaya}>{wilaya}</option>)}</select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Tous types</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="severity">Trier : priorité</option><option value="date">Trier : date</option></select>
      </div>

      <div className="alerts-layout">
        <div className="alerts-list">
          {visible.length === 0 && <div className="alerts-empty"><strong>Aucune alerte ne correspond aux filtres</strong><p>Modifiez la recherche, la priorité, l’état ou la wilaya sélectionnée.</p></div>}
          {visible.map((alert) => (
            <article key={alert.id} className={`alerts-item ${alert.state} ${selected?.id === alert.id ? 'selected' : ''}`} onClick={() => setSelectedId(alert.id)}>
              <span className="alerts-severity" style={{ background: SEVERITY_COLORS[alert.severity] }} />
              <div>
                <div className="alerts-item-top"><strong>{alert.title}</strong><span className={`alerts-state ${alert.state}`}>{ACTION_LABELS[alert.state]}</span></div>
                <p>{alert.detail}</p>
                <div className="alerts-meta"><span>{SEVERITY_LABELS[alert.severity]}</span><span>{alert.type}</span><span>{alert.project?.wilaya ?? 'Wilaya non renseignée'}</span><span>{alert.date ?? '—'}</span></div>
                <div className="alerts-actions">
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert.id, 'acknowledged'); }} disabled={alert.state !== 'open'}>Prendre en charge</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert.id, 'resolved'); }} disabled={alert.state === 'resolved' || alert.state === 'dismissed'}>Résoudre</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert.id, 'dismissed'); }} disabled={alert.state === 'dismissed'}>Écarter</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="alerts-detail">
          {selected ? (
            <>
              <h3>{selected.title}</h3>
              <span className={`alerts-state ${selected.state}`}>{ACTION_LABELS[selected.state]}</span>
              <p>{selected.detail}</p>
              <dl><div><dt>Priorité</dt><dd>{SEVERITY_LABELS[selected.severity]}</dd></div><div><dt>Type</dt><dd>{selected.type}</dd></div><div><dt>Date</dt><dd>{selected.date ?? '—'}</dd></div></dl>
              {selected.project && <div className="alerts-project"><strong>Projet associé</strong><p>{selected.project.name}</p><span>{selected.project.wilaya} · {selected.project.progress}% · {selected.project.status}</span></div>}
            </>
          ) : <p>Sélectionnez une alerte pour afficher les détails.</p>}
        </aside>
      </div>
    </section>
  );
}

export default AlertsModule;
