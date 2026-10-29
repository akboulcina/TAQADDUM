import { useMemo } from 'react';
import './RoleDashboard.css';

const STATUS = { onTrack: 'En bonne voie', atRisk: 'À risque', delayed: 'En retard', completed: 'Achevé' };
const SEVERITY = { critical: 'Critique', high: 'Élevée', medium: 'Moyenne', low: 'Faible' };
const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const money = (value) => value == null ? '—' : new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value);
const billions = (value) => value == null ? '—' : `${(value / 1_000_000_000).toLocaleString('fr-DZ', { maximumFractionDigits: 1 })} Mds DZD`;

function normalize(project) {
  if (!project) return null;
  return { id: project.id ?? project.code ?? project.name, name: project.name ?? project.title ?? 'Projet', wilaya: project.wilaya ?? 'Non renseignée', sector: project.sector ?? 'Non renseigné', status: project.status ?? 'onTrack', priority: project.priority ?? 'medium', progress: num(project.progress) ?? 0, budget: num(project.budget), committed: num(project.committed) ?? num(project.budget), paid: num(project.paid) ?? 0, manager: project.manager ?? 'Non renseigné', dueDate: project.dueDate ?? null };
}

function Card({ title, subtitle, children, className = '' }) {
  return <section className={`rd-card ${className}`}><header><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</header><div>{children}</div></section>;
}

function Metric({ label, value, note }) {
  return <article className="rd-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function Bar({ label, value, secondary, caption }) {
  return <div className="rd-bar"><span>{label}</span><div className="rd-bar-track"><i style={{ width: `${value}%` }} />{secondary != null && <i className="secondary" style={{ width: `${secondary}%` }} />}</div><strong>{caption}</strong></div>;
}

function Donut({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="rd-donut">
      <svg viewBox="0 0 150 150" width="155" height="155" role="img" aria-label="Répartition du portefeuille">
        <g transform="translate(75 75) rotate(-90)">
          {data.map((item) => { const dash = (item.value / Math.max(1, total)) * circumference; const node = <circle key={item.key} r={radius} fill="none" stroke={item.color} strokeWidth="17" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} />; offset += dash; return node; })}
        </g>
        <text x="75" y="81" textAnchor="middle" className="rd-donut-value">{total}</text>
      </svg>
      <ul>{data.map((item) => <li key={item.key}><i style={{ background: item.color }} />{item.label}<strong>{item.value}</strong></li>)}</ul>
    </div>
  );
}

function usePortfolio(projects) {
  return useMemo(() => {
    const data = projects.map(normalize).filter(Boolean);
    const today = new Date();
    return {
      projects: data,
      total: data.length,
      progress: data.length ? data.reduce((sum, item) => sum + item.progress, 0) / data.length : 0,
      budget: data.reduce((sum, item) => sum + (item.budget ?? 0), 0),
      committed: data.reduce((sum, item) => sum + (item.committed ?? 0), 0),
      paid: data.reduce((sum, item) => sum + item.paid, 0),
      delayed: data.filter((item) => item.status === 'delayed'),
      risky: data.filter((item) => item.status === 'atRisk' || item.status === 'delayed'),
      completed: data.filter((item) => item.status === 'completed'),
      overdue: data.filter((item) => item.dueDate && item.status !== 'completed' && new Date(item.dueDate) < today),
      byWilaya: [...new Set(data.map((item) => item.wilaya))].map((wilaya) => {
        const items = data.filter((item) => item.wilaya === wilaya);
        return { wilaya, count: items.length, progress: items.reduce((sum, item) => sum + item.progress, 0) / items.length, budget: items.reduce((sum, item) => sum + (item.budget ?? 0), 0), delayed: items.filter((item) => item.status === 'delayed').length };
      }),
      bySector: [...new Set(data.map((item) => item.sector))].map((sector) => {
        const items = data.filter((item) => item.sector === sector);
        return { sector, committed: items.reduce((sum, item) => sum + (item.committed ?? 0), 0), paid: items.reduce((sum, item) => sum + item.paid, 0), progress: items.reduce((sum, item) => sum + item.progress, 0) / items.length };
      })
    };
  }, [projects]);
}

function ExecutiveDashboard({ portfolio, alerts }) {
  const decisions = [...portfolio.delayed, ...portfolio.risky].slice(0, 4);
  return (
    <>
      <div className="rd-metrics">
        <Metric label="Projets" value={portfolio.total} note="Portefeuille consolidé" />
        <Metric label="Avancement" value={`${portfolio.progress.toFixed(1)}%`} note="Moyenne pondérée simple" />
        <Metric label="Budget" value={billions(portfolio.budget)} note="Budget approuvé" />
        <Metric label="Engagements" value={billions(portfolio.committed)} note="Cumul engagé" />
        <Metric label="Paiements" value={billions(portfolio.paid)} note="Cumul payé" />
        <Metric label="Risques critiques" value={alerts.filter((alert) => alert.severity === 'critical').length} note="Alertes à arbitrer" />
      </div>
      <div className="rd-grid">
        <Card title="Santé stratégique du portefeuille">
          <Donut data={[{ key: 'onTrack', label: 'En bonne voie', value: portfolio.projects.filter((item) => item.status === 'onTrack').length, color: '#12805C' }, { key: 'atRisk', label: 'À risque', value: portfolio.projects.filter((item) => item.status === 'atRisk').length, color: '#D97706' }, { key: 'delayed', label: 'En retard', value: portfolio.delayed.length, color: '#B42318' }, { key: 'completed', label: 'Achevés', value: portfolio.completed.length, color: '#4B5565' }]} />
        </Card>
        <Card title="Décisions requises" subtitle="Projets stratégiques à risque ou en retard">
          {decisions.length ? decisions.map((project) => <div key={project.id} className="rd-row"><div><strong>{project.name}</strong><span>{project.wilaya} · {STATUS[project.status]} · {project.progress}%</span></div><span className="rd-pill danger">Arbitrage</span></div>) : <p className="rd-empty">Aucun projet ne requiert actuellement une décision exécutive.</p>}
        </Card>
      </div>
    </>
  );
}

function PmoDashboard({ portfolio, alerts }) {
  const missingReports = portfolio.risky.slice(0, 4);
  return (
    <>
      <div className="rd-metrics">
        <Metric label="Projets suivis" value={portfolio.total} />
        <Metric label="En retard" value={portfolio.delayed.length} />
        <Metric label="Échéances dépassées" value={portfolio.overdue.length} />
        <Metric label="Alertes actives" value={alerts.length} />
        <Metric label="Complétude reporting" value={`${Math.max(0, 100 - (missingReports.length / Math.max(1, portfolio.total)) * 100).toFixed(0)}%`} note="Estimation de démonstration" />
        <Metric label="Avancement global" value={`${portfolio.progress.toFixed(1)}%`} />
      </div>
      <div className="rd-grid">
        <Card title="Priorités de coordination">
          {[...portfolio.overdue, ...portfolio.delayed].slice(0, 5).map((project) => <div key={project.id} className="rd-row"><div><strong>{project.name}</strong><span>{project.wilaya} · échéance {project.dueDate ?? '—'}</span></div><span className="rd-pill warning">Relance</span></div>)}
        </Card>
        <Card title="Escalades et alertes">
          {alerts.slice(0, 5).map((alert) => <div key={alert.id ?? alert.title} className="rd-row"><div><strong>{alert.title ?? 'Alerte'}</strong><span>{SEVERITY[alert.severity] ?? 'Moyenne'} · {alert.project ?? 'Projet non renseigné'}</span></div><span className={`rd-pill ${alert.severity === 'critical' ? 'danger' : 'warning'}`}>Escalade</span></div>)}
        </Card>
      </div>
    </>
  );
}

function OwnerDashboard({ portfolio, user }) {
  const assigned = portfolio.projects.filter((project) => project.manager === user?.name);
  const scope = assigned.length ? assigned : portfolio.projects.slice(0, 3);
  return (
    <>
      <div className="rd-metrics">
        <Metric label="Projets assignés" value={scope.length} note={assigned.length ? 'Périmètre fourni' : 'Périmètre de démonstration'} />
        <Metric label="Approbations attendues" value={scope.filter((item) => item.status === 'atRisk').length} />
        <Metric label="Engagements" value={billions(scope.reduce((sum, item) => sum + (item.committed ?? 0), 0))} />
        <Metric label="Paiements" value={billions(scope.reduce((sum, item) => sum + item.paid, 0))} />
      </div>
      <div className="rd-grid">
        <Card title="Projets dont vous avez la charge">
          {scope.map((project) => <div key={project.id} className="rd-row"><div><strong>{project.name}</strong><span>{project.wilaya} · {STATUS[project.status]} · {project.progress}%</span></div><span className="rd-pill info">Suivi</span></div>)}
        </Card>
        <Card title="Décisions et jalons">
          {scope.slice(0, 4).map((project) => <div key={project.id} className="rd-row"><div><strong>{project.name}</strong><span>Échéance : {project.dueDate ?? '—'}</span></div><span className="rd-pill warning">Décision requise</span></div>)}
        </Card>
      </div>
    </>
  );
}

function ManagerDashboard({ portfolio, user }) {
  const own = portfolio.projects.filter((project) => project.manager === user?.name);
  const focus = own[0] ?? portfolio.projects[0];
  return (
    <>
      <div className="rd-metrics">
        <Metric label="Projet prioritaire" value={focus?.name ?? '—'} note={focus ? `${focus.wilaya} · ${STATUS[focus.status]}` : ''} />
        <Metric label="Avancement" value={`${focus?.progress ?? 0}%`} />
        <Metric label="Échéance" value={focus?.dueDate ?? '—'} />
        <Metric label="Actions immédiates" value={portfolio.risky.length} />
      </div>
      <div className="rd-grid">
        <Card title="Jalons et exécution"><Bar label={focus?.name ?? 'Projet'} value={focus?.progress ?? 0} caption={`${focus?.progress ?? 0}%`} /><p className="rd-note">Priorité : traiter les risques et livrables du projet avant la prochaine revue.</p></Card>
        <Card title="Risques et actions du jour">
          {portfolio.risky.slice(0, 4).map((project) => <div key={project.id} className="rd-row"><div><strong>{project.name}</strong><span>{STATUS[project.status]} · {project.progress}%</span></div><span className="rd-pill danger">Action</span></div>)}
        </Card>
      </div>
    </>
  );
}

function FinanceDashboard({ portfolio }) {
  const overruns = portfolio.projects.filter((project) => project.committed != null && project.paid > project.committed);
  const maxBudget = Math.max(1, ...portfolio.bySector.map((item) => item.committed));
  return (
    <>
      <div className="rd-metrics">
        <Metric label="Budget approuvé" value={billions(portfolio.budget)} />
        <Metric label="Engagements" value={billions(portfolio.committed)} />
        <Metric label="Paiements" value={billions(portfolio.paid)} />
        <Metric label="Taux de décaissement" value={`${portfolio.committed ? ((portfolio.paid / portfolio.committed) * 100).toFixed(1) : 0}%`} />
        <Metric label="Anomalies" value={overruns.length} note="Paiements > engagements" />
      </div>
      <div className="rd-grid">
        <Card title="Exécution par secteur">
          {portfolio.bySector.map((item) => <Bar key={item.sector} label={item.sector} value={(item.committed / maxBudget) * 100} secondary={(item.paid / maxBudget) * 100} caption={billions(item.committed)} />)}
        </Card>
        <Card title="Projets à revue financière">
          {overruns.length ? overruns.map((project) => <div key={project.id} className="rd-row"><div><strong>{project.name}</strong><span>{money(project.paid)} payés / {money(project.committed)} engagés</span></div><span className="rd-pill danger">Anomalie</span></div>) : portfolio.projects.slice(0, 4).map((project) => <div key={project.id} className="rd-row"><div><strong>{project.name}</strong><span>{money(project.paid)} payés / {money(project.committed)} engagés</span></div><span className="rd-pill info">À suivre</span></div>)}
        </Card>
      </div>
    </>
  );
}

function TerritorialDashboard({ portfolio }) {
  const maxBudget = Math.max(1, ...portfolio.byWilaya.map((item) => item.budget));
  return (
    <>
      <div className="rd-metrics">
        <Metric label="Wilayas couvertes" value={portfolio.byWilaya.length} />
        <Metric label="Projets" value={portfolio.total} />
        <Metric label="Wilayas avec retard" value={portfolio.byWilaya.filter((item) => item.delayed > 0).length} />
        <Metric label="Budget territorial" value={billions(portfolio.budget)} />
      </div>
      <div className="rd-grid">
        <Card title="Progression par wilaya">
          {portfolio.byWilaya.map((item) => <Bar key={item.wilaya} label={item.wilaya} value={item.progress} caption={`${item.progress.toFixed(0)}%`} />)}
        </Card>
        <Card title="Suivi de terrain prioritaire">
          {portfolio.byWilaya.slice().sort((a, b) => b.delayed - a.delayed).slice(0, 5).map((item) => <div key={item.wilaya} className="rd-row"><div><strong>{item.wilaya}</strong><span>{item.count} projet(s) · {item.delayed} retard(s) · {billions(item.budget)}</span></div><span className={`rd-pill ${item.delayed ? 'danger' : 'info'}`}>{item.delayed ? 'Terrain requis' : 'À suivre'}</span></div>)}
        </Card>
      </div>
    </>
  );
}

export function RoleDashboard({ user, projects = [], kpis = [], alerts = [] }) {
  const portfolio = usePortfolio(projects);
  const roleId = user?.id;
  const roleName = user?.role?.fr ?? 'Rôle non renseigné';

  const content = roleId === 'dg' ? <ExecutiveDashboard portfolio={portfolio} alerts={alerts} />
    : roleId === 'pmo' ? <PmoDashboard portfolio={portfolio} alerts={alerts} />
    : roleId === 'mo' ? <OwnerDashboard portfolio={portfolio} user={user} />
    : roleId === 'pm' ? <ManagerDashboard portfolio={portfolio} user={user} />
    : roleId === 'finance' ? <FinanceDashboard portfolio={portfolio} />
    : roleId === 'territorial' ? <TerritorialDashboard portfolio={portfolio} />
    : <Card title="Rôle non reconnu" subtitle="Affichage de secours"><p className="rd-empty">Le rôle « {roleName} » n’a pas de tableau de bord dédié. Les indicateurs généraux du portefeuille sont affichés.</p><div className="rd-metrics"><Metric label="Projets" value={portfolio.total} /><Metric label="Avancement" value={`${portfolio.progress.toFixed(1)}%`} /><Metric label="Budget" value={billions(portfolio.budget)} /></div></Card>;

  return (
    <section className="role-dashboard" aria-label={`Tableau de bord ${roleName}`}>
      <header className="rd-header">
        <div><p className="rd-brand">TAQADDUM</p><h2>Tableau de bord — {roleName}</h2><p>{user?.focus?.fr ?? 'Pilotage du portefeuille de projets'}</p></div>
        <span className="rd-demo-badge">Données simulées</span>
      </header>
      {content}
      {kpis.length > 0 && <Card title="Indicateurs fournis" className="rd-kpis"><div className="rd-kpi-row">{kpis.map((kpi, index) => <Metric key={kpi.id ?? index} label={kpi.label ?? kpi.labelKey ?? 'Indicateur'} value={kpi.value ?? '—'} />)}</div></Card>}
    </section>
  );
}

export default RoleDashboard;
