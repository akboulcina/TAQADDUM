import { useApp } from '../context/AppContext.jsx';
import { routes, getIconPath } from './routes.jsx';

export default function Sidebar({ activeRoute, onNavigate }) {
  const { t } = useApp();
  const sections = ['pilotage', 'operations'];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div className="brand-text">
          <div className="brand-name">{t('app.name')}</div>
          <div className="brand-subtitle">{t('app.tagline')}</div>
        </div>
      </div>
      <nav aria-label={t('app.name')}>
        {sections.map((section) => (
          <div key={section}>
            <p className="nav-section-label">{t(`nav.${section}`)}</p>
            {routes.filter((route) => route.section === section).map((route) => (
              <button key={route.id} type="button" className={`nav-item ${activeRoute === route.id ? 'active' : ''}`} onClick={() => onNavigate(route.id)} aria-current={activeRoute === route.id ? 'page' : undefined}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={getIconPath(route.icon)} /></svg>
                <span className="nav-label">{t(route.labelKey)}</span>
                {route.badge ? <span className="nav-badge">{route.badge}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer"><div className="demo-note"><strong>{t('app.demo')}</strong><br />{t('footer.demo')}</div></div>
    </aside>
  );
}
