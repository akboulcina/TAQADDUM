import { useMemo, useRef, useState } from 'react';
import { ALGERIA_OUTLINE, projectPoint, MAP_WIDTH, MAP_HEIGHT } from './mapGeometry.js';
import './AlgeriaProjectMap.css';

const STATUS_COLORS = {
  onTrack: '#12805C',
  atRisk: '#D97706',
  delayed: '#B42318',
  completed: '#4B5565'
};

const STATUS_LABELS = {
  onTrack: 'En bonne voie',
  atRisk: 'À risque',
  delayed: 'En retard',
  completed: 'Achevé'
};

function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeProject(project) {
  if (!project) return null;
  return {
    id: project.id ?? project.code ?? project.name ?? Math.random().toString(36),
    name: project.name ?? project.title ?? 'Projet sans intitulé',
    wilaya: project.wilaya ?? project.region ?? 'Non renseignée',
    sector: project.sector ?? project.category ?? 'Non renseigné',
    status: project.status ?? 'onTrack',
    progress: asNumber(project.progress) ?? 0,
    budget: asNumber(project.budget),
    latitude: asNumber(project.latitude) ?? asNumber(project.lat),
    longitude: asNumber(project.longitude) ?? asNumber(project.lon) ?? asNumber(project.lng)
  };
}

function normalizeSite(site) {
  if (!site) return null;
  return {
    wilaya: site.wilaya ?? site.name ?? 'Non renseignée',
    status: site.status ?? 'onTrack',
    progress: asNumber(site.progress) ?? 0,
    latitude: asNumber(site.latitude) ?? asNumber(site.lat),
    longitude: asNumber(site.longitude) ?? asNumber(site.lon) ?? asNumber(site.lng),
    x: asNumber(site.x),
    y: asNumber(site.y)
  };
}

function formatBudget(value) {
  if (value == null) return 'Budget non renseigné';
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value);
}

export function AlgeriaProjectMap({ sites = [], projects = [], selectedWilaya = null, onSelectWilaya }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);

  const normalizedProjects = useMemo(
    () => projects.map(normalizeProject).filter(Boolean),
    [projects]
  );
  const normalizedSites = useMemo(
    () => sites.map(normalizeSite).filter(Boolean),
    [sites]
  );

  const wilayas = useMemo(
    () => [...new Set([...normalizedSites.map((site) => site.wilaya), ...normalizedProjects.map((project) => project.wilaya)])].sort(),
    [normalizedSites, normalizedProjects]
  );
  const sectors = useMemo(
    () => [...new Set(normalizedProjects.map((project) => project.sector))].sort(),
    [normalizedProjects]
  );

  const visibleProjects = useMemo(
    () => normalizedProjects.filter((project) =>
      (statusFilter === 'all' || project.status === statusFilter) &&
      (sectorFilter === 'all' || project.sector === sectorFilter) &&
      (!selectedWilaya || project.wilaya === selectedWilaya)
    ),
    [normalizedProjects, statusFilter, sectorFilter, selectedWilaya]
  );

  const locatedProjects = visibleProjects.filter((project) => project.latitude != null && project.longitude != null);
  const unlocatedProjects = visibleProjects.filter((project) => project.latitude == null || project.longitude == null);

  const siteMarkers = normalizedSites
    .filter((site) => !selectedWilaya || site.wilaya === selectedWilaya)
    .map((site) => {
      const siteProjects = visibleProjects.filter((project) => project.wilaya === site.wilaya);
      const located = siteProjects.filter((project) => project.latitude != null && project.longitude != null);
      const position = located.length
        ? projectPoint(located[0].longitude, located[0].latitude)
        : site.latitude != null && site.longitude != null
          ? projectPoint(site.longitude, site.latitude)
          : site.x != null && site.y != null
            ? { x: (site.x / 620) * MAP_WIDTH, y: (site.y / 300) * MAP_HEIGHT }
            : null;
      return position ? { ...site, ...position, projectCount: siteProjects.length } : null;
    })
    .filter(Boolean);

  const selectedProject = normalizedProjects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedSite = normalizedSites.find((site) => site.wilaya === selectedWilaya) ?? null;

  const handleSelectWilaya = (wilaya) => {
    setSelectedProjectId(null);
    onSelectWilaya?.(selectedWilaya === wilaya ? null : wilaya);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    setZoom((current) => Math.min(4, Math.max(1, current - event.deltaY * 0.0015)));
  };

  const handlePointerDown = (event) => {
    dragState.current = { startX: event.clientX, startY: event.clientY, pan };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState.current) return;
    const { startX, startY, pan: initialPan } = dragState.current;
    setPan({ x: initialPan.x + event.clientX - startX, y: initialPan.y + event.clientY - startY });
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  return (
    <section className="apm-module" aria-label="Cartographie interactive des projets">
      <header className="apm-header">
        <div>
          <p className="apm-brand">TAQADDUM</p>
          <h2>Cartographie interactive des projets</h2>
          <p className="apm-subtitle">Sélectionnez une wilaya, filtrez le portefeuille et examinez les projets localisés.</p>
        </div>
        <span className="apm-demo-badge">Données simulées</span>
      </header>

      <div className="apm-toolbar">
        <label>
          Wilaya
          <select value={selectedWilaya ?? 'all'} onChange={(event) => handleSelectWilaya(event.target.value === 'all' ? null : event.target.value)}>
            <option value="all">Toutes les wilayas</option>
            {wilayas.map((wilaya) => <option key={wilaya} value={wilaya}>{wilaya}</option>)}
          </select>
        </label>
        <label>
          Statut
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          Secteur
          <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
            <option value="all">Tous les secteurs</option>
            {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
          </select>
        </label>
        <button type="button" className="apm-reset" onClick={() => { setStatusFilter('all'); setSectorFilter('all'); setSelectedProjectId(null); onSelectWilaya?.(null); }}>
          Réinitialiser
        </button>
      </div>

      <div className="apm-layout">
        <div className="apm-map-card">
          <div
            className="apm-map-viewport"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label="Carte interactive de l’Algérie">
              <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                <path className="apm-country" d={ALGERIA_OUTLINE} />
                {siteMarkers.map((marker) => (
                  <g key={marker.wilaya} className={`apm-marker ${selectedWilaya === marker.wilaya ? 'selected' : ''}`} onClick={() => handleSelectWilaya(marker.wilaya)} tabIndex={0} role="button" aria-label={`${marker.wilaya} — ${marker.progress}%`}>
                    <circle cx={marker.x} cy={marker.y} r={selectedWilaya === marker.wilaya ? 11 : 7} fill={STATUS_COLORS[marker.status] ?? '#2F80ED'} />
                    {selectedWilaya === marker.wilaya && <circle cx={marker.x} cy={marker.y} r="17" className="apm-marker-ring" />}
                    <text x={marker.x + 13} y={marker.y + 4}>{marker.wilaya}</text>
                    <title>{`${marker.wilaya} · ${marker.projectCount} projet(s) · ${marker.progress}%`}</title>
                  </g>
                ))}
                {locatedProjects.map((project) => {
                  const point = projectPoint(project.longitude, project.latitude);
                  return (
                    <g key={project.id} className={`apm-project-marker ${selectedProjectId === project.id ? 'selected' : ''}`} onClick={() => setSelectedProjectId(project.id)} tabIndex={0} role="button" aria-label={project.name}>
                      <circle cx={point.x} cy={point.y} r="5" fill={STATUS_COLORS[project.status] ?? '#2F80ED'} />
                      <title>{`${project.name}\n${project.wilaya} · ${STATUS_LABELS[project.status] ?? project.status} · ${project.progress}%`}</title>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          <div className="apm-map-footer">
            <div className="apm-legend">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <span key={value}><i style={{ background: STATUS_COLORS[value] }} />{label}</span>
              ))}
            </div>
            <p>Molette : zoom · Glisser : déplacer · Clic : sélection</p>
          </div>
        </div>

        <aside className="apm-detail-card">
          {selectedProject ? (
            <>
              <h3>{selectedProject.name}</h3>
              <p className="apm-detail-id">{selectedProject.id}</p>
              <dl>
                <div><dt>Wilaya</dt><dd>{selectedProject.wilaya}</dd></div>
                <div><dt>Secteur</dt><dd>{selectedProject.sector}</dd></div>
                <div><dt>Statut</dt><dd>{STATUS_LABELS[selectedProject.status] ?? selectedProject.status}</dd></div>
                <div><dt>Avancement</dt><dd>{selectedProject.progress}%</dd></div>
                <div><dt>Budget</dt><dd>{formatBudget(selectedProject.budget)}</dd></div>
              </dl>
              <div className="apm-progress"><span style={{ width: `${selectedProject.progress}%` }} /></div>
              <button type="button" onClick={() => setSelectedProjectId(null)}>Fermer le projet</button>
            </>
          ) : selectedWilaya ? (
            <>
              <h3>{selectedWilaya}</h3>
              {selectedSite && <p className="apm-detail-id">Avancement territorial : {selectedSite.progress}%</p>}
              <p className="apm-count">{visibleProjects.length} projet(s) correspondant aux filtres</p>
              <ul className="apm-project-list">
                {visibleProjects.map((project) => (
                  <li key={project.id}>
                    <button type="button" onClick={() => setSelectedProjectId(project.id)}>
                      <strong>{project.name}</strong>
                      <span>{STATUS_LABELS[project.status] ?? project.status} · {project.progress}%</span>
                    </button>
                  </li>
                ))}
              </ul>
              {unlocatedProjects.length > 0 && (
                <p className="apm-warning">{unlocatedProjects.length} projet(s) sans coordonnées exploitables ne sont pas positionnés.</p>
              )}
              <button type="button" onClick={() => onSelectWilaya?.(null)}>Effacer la sélection</button>
            </>
          ) : (
            <>
              <h3>Aucune wilaya sélectionnée</h3>
              <p>Sélectionnez un repère sur la carte ou une wilaya dans les filtres pour afficher les projets associés.</p>
              <p className="apm-count">{visibleProjects.length} projet(s) correspondant aux filtres</p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

export default AlgeriaProjectMap;
