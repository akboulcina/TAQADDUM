import { useApp } from '../context/AppContext.jsx';

const languages = [{ id: 'fr', label: 'Français' }, { id: 'ar', label: 'العربية' }, { id: 'en', label: 'English' }];

export default function TopBar({ route }) {
  const { t, lang, setLang, user, users, setUser } = useApp();
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>{t('app.name')}</span><span>/</span><strong>{t(route.labelKey)}</strong></div>
      <div className="global-search">
        <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" strokeLinecap="round" /></svg>
        <input type="search" placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} />
      </div>
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label={t('topbar.notifications')} title={t('topbar.notifications')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 4a6 6 0 0 1 6 6v4l2 3H4l2-3v-4a6 6 0 0 1 6-6Zm-2 16h4" /></svg>
          <span className="notification-dot" />
        </button>
        <select className="select-control" value={lang} onChange={(event) => setLang(event.target.value)} aria-label={t('topbar.language')}>
          {languages.map((language) => <option key={language.id} value={language.id}>{language.label}</option>)}
        </select>
        <select id="demo-user" className="select-control" value={user.id} onChange={(event) => setUser(event.target.value)} aria-label={t('topbar.demoUser')}>
          {users.map((demoUser) => <option key={demoUser.id} value={demoUser.id}>{demoUser.name} — {demoUser.role[lang]}</option>)}
        </select>
        <div className="user-menu">
          <span className="avatar" style={{ background: user.color }}>{user.initials}</span>
          <span className="user-meta"><span className="user-name">{user.name}</span><br /><span className="user-role">{user.role[lang]}</span></span>
        </div>
      </div>
    </header>
  );
}
