import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Lang = 'fr' | 'en' | 'ar';
type ApiState = 'loading' | 'ok' | 'down';
const text = {
  fr: { title: 'TAQADDUM', loading: 'Connexion…', ok: 'API connectée', down: 'API indisponible', lang: 'Langue' },
  en: { title: 'TAQADDUM', loading: 'Connecting…', ok: 'API connected', down: 'API unavailable', lang: 'Language' },
  ar: { title: 'تقدم', loading: 'جار الاتصال…', ok: 'واجهة API متصلة', down: 'واجهة API غير متاحة', lang: 'اللغة' },
} as const;
function App() {
  const [lang, setLang] = useState<Lang>('fr');
  const [state, setState] = useState<ApiState>('loading');
  const t = text[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/health/ready`)
      .then((response) => { if (!response.ok) throw new Error('health'); setState('ok'); })
      .catch(() => setState('down'));
  }, []);
  return <main><label htmlFor="language">{t.lang}</label><select id="language" aria-label={t.lang} value={lang} onChange={(event) => setLang(event.target.value as Lang)}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select><h1>{t.title}</h1><p role="status" aria-live="polite">{state === 'loading' ? t.loading : state === 'ok' ? t.ok : t.down}</p></main>;
}
createRoot(document.getElementById('root')!).render(<App />);
