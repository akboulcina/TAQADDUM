import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
const text={fr:{title:'TAQADDUM',loading:'Connexion…',ok:'API connectée',down:'API indisponible',lang:'Langue'},en:{title:'TAQADDUM',loading:'Connecting…',ok:'API connected',down:'API unavailable',lang:'Language'},ar:{title:'تقدم',loading:'جار الاتصال…',ok:'واجهة API متصلة',down:'واجهة API غير متاحة',lang:'اللغة'}};
type Lang='fr'|'en'|'ar';
function App(){const [lang,setLang]=useState<Lang>('fr');const [state,setState]=useState('loading');const t=text[lang];useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';fetch(`${import.meta.env.VITE_API_BASE_URL??'http://localhost:3000'}/health/ready`).then(r=>{if(!r.ok)throw Error();setState('ok')}).catch(()=>setState('down'))},[]);return <main><p>{t.lang}</p><select aria-label={t.lang} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select><h1>{t.title}</h1><p>{state==='loading'?t.loading:state==='ok'?t.ok:t.down}</p></main>}
createRoot(document.getElementById('root')!).render(<App/>);
