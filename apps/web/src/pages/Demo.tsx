import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertBanner, Button, StatusBadge, Text } from '@taqaddum/ui';
import { useTranslation, type Locale } from '@taqaddum/i18n-ui';

import '@taqaddum/design-tokens/tokens.css';
import './demo.css';


const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
type ProjectStatus = 'draft' | 'authorized' | 'archived';

type Project = {
  id: string;
  code: string;
  name: string;
  organization: string;
  status: ProjectStatus;
  updatedAt: string;
};

type AuditEntry = {
  id: string;
  action: string;
  object: string;
  result: string;
  at: string;
};

const initialProjects: Project[] = [
  {
    id: 'demo-001',
    code: 'PRJ-001',
    name: 'Programme de modernisation',
    organization: 'Organisation Démo',
    status: 'authorized',
    updatedAt: '2026-09-22 09:30',
  },
  {
    id: 'demo-002',
    code: 'PRJ-002',
    name: 'Réhabilitation des infrastructures',
    organization: 'Organisation Démo',
    status: 'draft',
    updatedAt: '2026-09-22 10:15',
  },
];

const initialAudit: AuditEntry[] = [
  {
    id: 'audit-001',
    action: 'Projet autorisé',
    object: 'PRJ-001',
    result: 'Succès',
    at: '2026-09-22 09:30',
  },
  {
    id: 'audit-002',
    action: 'Document vérifié',
    object: 'DOC-001',
    result: 'Succès',
    at: '2026-09-21 16:45',
  },
];

const navigation = [
  ['overview', 'Vue d’ensemble', 'Disponible'],
  ['portfolios', 'Portefeuilles', 'Démo'],
  ['projects', 'Projets', 'Disponible'],
  ['contracts', 'Contrats et marchés', 'À venir'],
  ['finance', 'Finance', 'À venir'],
  ['field', 'Terrain et GIS', 'Démo'],
  ['control', 'Centre de contrôle', 'Démo'],
  ['decisions', 'Décisions et actions', 'À venir'],
  ['reports', 'Rapports', 'Démo'],
  ['admin', 'Administration', 'À venir'],
] as const;

function statusLabel(status: ProjectStatus) {
  return {
    draft: 'Brouillon',
    authorized: 'Autorisé',
    archived: 'Archivé',
  }[status];
}

function statusTone(status: ProjectStatus) {
  return status === 'authorized' ? 'success' : status === 'draft' ? 'warning' : 'neutral';
}

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

  useEffect(() => {


    fetch(`${apiBaseUrl}/health/ready`)
      .then((response) => setApiReady(response.ok))
      .catch(() => setApiReady(false))
      .finally(() => setLastChecked(new Date()));
  }, []);

  useEffect(() => {
    if (!isCreateOpen) createButtonRef.current?.focus();
  }, [isCreateOpen]);

  const locales: Locale[] = ['fr', 'ar', 'en'];

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesQuery = `${project.code} ${project.name} ${project.organization}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [projects, query, statusFilter],
  );


  async function loadProjects() {
    try {
      const response = await fetch(`${apiBaseUrl}/v1/projects`, {
        headers: {
          Accept: 'application/json',
          'X-Tenant-Id': '68b04727-b370-4fae-a518-a5f74280f2f8',
          'X-Organization-Id': '078c5634-6903-4476-af7c-a252a713e378',
        },
      });

      if (!response.ok) {
        throw new Error(`Impossible de charger les projets (${response.status})`);
      }

      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : (payload.items ?? payload.data ?? []);

      setProjects(rows.map((project: any) => ({
        id: project.id,
        code: project.code ?? project.projectCode ?? project.project_code,
        name: project.name ?? project.nameFr ?? project.name_fr,
        status: project.status,
        organization: project.organization ?? 'Organisation Démo',
        updatedAt: project.updatedAt ?? project.updated_at ?? new Date().toISOString(),
      })));
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : 'Erreur de chargement des projets');
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function createProject() {
    const code = newCode.trim();
    const name = newName.trim();

    if (!code || !name) {
      setNotice('Le code et le nom du projet sont obligatoires.');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Tenant-Id': '68b04727-b370-4fae-a518-a5f74280f2f8',
          'X-Organization-Id': '078c5634-6903-4476-af7c-a252a713e378',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          code,
          name,
          nameFr: name,
          nameAr: name,
          nameEn: name,
          organizationId: '078c5634-6903-4476-af7c-a252a713e378',
          description: '',
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Création refusée (${response.status}) : ${detail}`);
      }

      setNewCode('');
      setNewName('');
      setCreateOpen(false);
      setNotice('Projet créé et enregistré dans la base de données.');
      await loadProjects();
    } catch (error) {
      console.error(error);
      setNotice(error instanceof Error ? error.message : 'Erreur de création du projet');
    }
  }

  function authorizeProject() {
    if (!isAuthorizeOpen || !justification.trim()) {
      setNotice('Une justification est obligatoire.');
      return;
    }

    const project = isAuthorizeOpen;
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? { ...item, status: 'authorized', updatedAt: new Date().toLocaleString() }
          : item,
      ),
    );
    setAudit((current) => [
      {
        id: `audit-${Date.now()}`,
        action: 'Projet autorisé',
        object: project.code,
        result: 'Mode démonstration',
        at: new Date().toLocaleString(),
      },
      ...current,
    ]);
    setNotice(`Projet ${project.code} autorisé en mode démonstration.`);
    setJustification('');
    setAuthorizeOpen(null);
  }

  return (
    <div className="app-shell" dir={direction}>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">T</span>
          <Text as="span" variant="title">{t('app_name')}</Text>
        </div>

        <div className="topbar__context">
          <span className="context-chip">Démo · Organisation Démo</span>
          <span className="context-chip">Local</span>
          <StatusBadge tone={apiReady ? 'success' : 'warning'}>
            {apiReady ? 'API connectée' : 'API indisponible'}
          </StatusBadge>
          <span className="topbar__meta">
            Vérifiée à {lastChecked.toLocaleTimeString()}
          </span>
          <Button size="sm" variant="secondary" aria-label="Notifications">
            3
          </Button>
          <Button size="sm" variant="secondary">Admin Demo</Button>
          <nav className="locale-switcher" aria-label="Langue">
            {locales.map((candidate) => (
              <Button
                key={candidate}
                size="sm"
                variant={locale === candidate ? 'primary' : 'secondary'}
                aria-pressed={locale === candidate}
                onClick={() => setLocale(candidate)}
              >
                {candidate.toUpperCase()}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <div className="shell-body">
        <aside className="sidebar" aria-label="Navigation principale">
          <div className="sidebar__heading">Modules</div>
          <nav className="sidebar__nav">
            {navigation.map(([id, label, state]) => (
              <button
                key={id}
                type="button"
                className={`nav-item ${activeSection === id ? 'nav-item--active' : ''}`}
                onClick={() => setActiveSection(id)}
              >
                <span>{label}</span>
                <small>{state}</small>
              </button>
            ))}
          </nav>
          <div className="demo-note">
            <StatusBadge tone="info">Mode démonstration</StatusBadge>
            <p>Les données locales ne sont pas persistées côté serveur.</p>
          </div>
        </aside>

        <main className="content">
          {notice ? (
            <AlertBanner tone="success" dismissible dismissLabel="Fermer" onDismiss={() => setNotice(null)}>
              {notice}
            </AlertBanner>
          ) : null}

          <section className="page-heading">
            <div>
              <span className="eyebrow">TAQADDUM · Release 0</span>
              <Text as="h1" variant="title">Vue d’ensemble</Text>
              <p>Un espace de contrôle unifié pour les projets, les preuves et l’audit.</p>
            </div>
            <div className="heading-actions">
              <span className="scope-label">Portée active · Organisation Démo</span>
              <span className="scope-label">Données fraîches · aujourd’hui</span>
            </div>
          </section>

          <section className="metric-grid" aria-label="Résumé">
            <article className="metric-card"><span>Projets actifs</span><strong>{projects.filter((p) => p.status === 'authorized').length}</strong><small>dans la portée active</small></article>
            <article className="metric-card"><span>File d’attention</span><strong>{projects.filter((p) => p.status === 'draft').length}</strong><small>projets à autoriser</small></article>
            <article className="metric-card"><span>Documents</span><strong>12</strong><small>6 preuves vérifiées</small></article>
            <article className="metric-card"><span>Audit récent</span><strong>{audit.length}</strong><small>événements démonstratifs</small></article>
          </section>

          <section className="content-grid">
            <article className="panel panel--wide" id="projects">
              <div className="panel__header">
                <div>
                  <span className="eyebrow">Portefeuille</span>
                  <Text as="h2" variant="heading">Projets</Text>
                </div>
                <Button ref={createButtonRef} onClick={() => setCreateOpen(true)}>Créer un projet</Button>
              </div>

              <div className="table-toolbar">
                <label>
                  Rechercher
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, nom ou organisation" />
                </label>
                <label>
                  Statut
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                    <option value="all">Tous</option>
                    <option value="draft">Brouillon</option>
                    <option value="authorized">Autorisé</option>
                    <option value="archived">Archivé</option>
                  </select>
                </label>
              </div>

              <div className="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>Nom</th><th>Statut</th><th>Organisation</th><th>Modification</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td><span className="code">{project.code}</span></td>
                        <td>{project.name}</td>
                        <td><StatusBadge tone={statusTone(project.status)}>{statusLabel(project.status)}</StatusBadge></td>
                        <td>{project.organization}</td>
                        <td>{project.updatedAt}</td>
                        <td>
                          {project.status === 'draft' ? (
                            <Button size="sm" variant="secondary" onClick={() => setAuthorizeOpen(project)}>Autoriser</Button>
                          ) : <span className="muted">Aucune action</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <div className="panel__header"><Text as="h2" variant="heading">Documents & preuves</Text><StatusBadge tone="info">Démo</StatusBadge></div>
              <div className="evidence-list">
                <div><strong>Rapport d’avancement</strong><span>v2 · Interne · PRJ-001</span><StatusBadge tone="success">Vérifié</StatusBadge></div>
                <div><strong>Procès-verbal de réunion</strong><span>v1 · Restreint · PRJ-002</span><StatusBadge tone="warning">À vérifier</StatusBadge></div>
                <a href="#audit">Voir l’audit des preuves</a>
              </div>
            </article>

            <article className="panel" id="audit">
              <div className="panel__header"><Text as="h2" variant="heading">Activité récente</Text><StatusBadge tone="info">Démo</StatusBadge></div>
              <div className="audit-list">
                {audit.slice(0, 4).map((entry) => (
                  <div key={entry.id}><span className="audit-dot" /><div><strong>{entry.action}</strong><span>{entry.object} · {entry.result}</span><small>{entry.at}</small></div></div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>

      {isCreateOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
            <div className="modal__header"><Text as="h2" variant="heading" id="create-project-title">Créer un projet</Text><Button size="sm" variant="secondary" onClick={() => setCreateOpen(false)}>Fermer</Button></div>
            <div className="form-grid">
              <label>Code<input value={newCode} onChange={(event) => setNewCode(event.target.value)} /></label>
              <label>Nom<input value={newName} onChange={(event) => setNewName(event.target.value)} /></label>
              <label>Organisation<input value={newOrganization} onChange={(event) => setNewOrganization(event.target.value)} /></label>
            </div>
            <div className="modal__actions"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Annuler</Button><Button onClick={createProject}>Créer</Button></div>
          </section>
        </div>
      ) : null}

      {isAuthorizeOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="authorize-project-title">
            <Text as="h2" variant="heading" id="authorize-project-title">Autoriser {isAuthorizeOpen.code}</Text>
            <p>Cette action est une transition de démonstration. Une justification est obligatoire.</p>
            <label>Justification<textarea value={justification} onChange={(event) => setJustification(event.target.value)} /></label>
            <div className="modal__actions"><Button variant="secondary" onClick={() => setAuthorizeOpen(null)}>Annuler</Button><Button onClick={authorizeProject}>Confirmer l’autorisation</Button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
