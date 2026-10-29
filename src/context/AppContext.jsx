import { createContext, useContext, useMemo, useState } from 'react';
import { translations } from '../data/i18n.js';
import { demoUsers } from '../data/users.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState('fr');
  const [userId, setUserId] = useState('dg');
  const user = demoUsers.find((item) => item.id === userId) ?? demoUsers[0];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const value = useMemo(() => {
    const t = (key) => translations[lang]?.[key] ?? translations.fr[key] ?? key;
    const formatDZD = (amount) => new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : lang === 'en' ? 'en-US' : 'fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount);
    return { lang, setLang, dir, user, setUser: setUserId, users: demoUsers, t, formatDZD };
  }, [lang, user]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
