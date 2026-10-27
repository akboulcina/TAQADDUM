import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation, type Locale } from '@taqaddum/i18n-ui';
import { MonitoringPanel, demoContext } from './MonitoringPanel';
import '@taqaddum/design-tokens/tokens.css';
import './demo.css';
const base=import.meta.env.VITE_API_BASE_URL??'';
type User={id:string;email:string;fullName:string;roleCode:string;roleName:string};
type Project={id:string;code:string;name:string;status:string;organization:string};
type Kpi={id:string;kpi_id:string;name:string;family:string;phase:string;unit:string;owner_role:string};
type Rule={id:string;rule_id:string;name:string;level:string;readable_condition:string;recipients:string};
export function Demo(){
  const {locale,setLocale,direction}=useTranslation('fr');
  const [user,setUser]=useState<User|null>(null);const [token,setToken]=useState('');
  const [email,setEmail]=useState('direction@taqaddum.dz');const [password,setPassword]=useState('');
  const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  const [ready,setReady]=useState<boolean|null>(null);const [section,setSection]=useState('monitoring');
  const [projects,setProjects]=useState<Project[]>([]);const [kpis,setKpis]=useState<Kpi[]>([]);const [rules,setRules]=useState<Rule[]>([]);
  const [create,setCreate]=useState(false);const [code,setCode]=useState('');const [name,setName]=useState('');const [query,setQuery]=useState('');
  useEffect(()=>{let active=true;async function health(){try{const r=await fetch(`${base}/health/ready`);if(active)setReady(r.ok);}catch{if(active)setReady(false);}}void health();const id=setInterval(()=>void health(),30000);return()=>{active=false;clearInterval(id);};},[]);
  async function api(path:string,auth:string,init:RequestInit={}){const r=await fetch(`${base}${path}`,{...init,headers:{...demoContext,Authorization:`Bearer ${auth}`,'Content-Type':'application/json'}});const p=await r.json();if(!r.ok)throw new Error(p.detail??`Erreur HTTP ${r.status}`);return p;}
  async function load(auth:string){
    const p=await api('/v1/projects',auth);setProjects(p.items??[]);
    const k=await api('/v1/kpis',auth);setKpis(k.items??[]);
    const a=await api('/v1/alert-rules',auth);setRules(a.items??[]);
  }
  async function login(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{const p=await api('/v1/auth/login','',{method:'POST',body:JSON.stringify({email,password})});setUser(p.user);setToken(p.token);setPassword('');setSection('monitoring');try{await load(p.token);}catch(e){setError(e instanceof Error?e.message:'Chargement des catalogues impossible');}}catch(e){setError(e instanceof Error?e.message:'Connexion impossible');}finally{setBusy(false);}}
  async function createProject(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{await api('/v1/projects',token,{method:'POST',body:JSON.stringify({code,name,nameFr:name,nameAr:name,nameEn:name})});setCode('');setName('');setCreate(false);setNotice('Projet enregistré. Les affectations de suivi doivent être configurées séparément.');await load(token);}catch(e){setError(e instanceof Error?e.message:'Création impossible');}finally{setBusy(false);}}
  function logout(){setUser(null);setToken('');setProjects([]);setKpis([]);setRules([]);setError('');setNotice('');}
  if(!user)return <div className="app-shell" dir={direction}><main className="content" style={{maxWidth:520,margin:'60px auto'}}><section className="panel"><h1>TAQADDUM · Connexion</h1>{error&&<p role="alert">{error}</p>}<form className="form-grid" onSubmit={login}><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mot de passe<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="submit" disabled={busy}>{busy?'Connexion…':'Se connecter'}</button></form><p>Comptes du pilote : mo@taqaddum.dz · pmo@taqaddum.dz · direction@taqaddum.dz</p></section></main></div>;
  const navigation=[['monitoring','Suivi opérationnel'],['projects','Projets'],['kpis','Catalogue KPI'],['rules','Catalogue des règles']];
  const validRules=rules.filter(r=>/^AL(0[1-9]|1[0-7])$/.test(r.rule_id));
  return <div className="app-shell" dir={direction}><header className="topbar"><div className="brand"><span className="brand__mark">T</span><strong>TAQADDUM</strong></div><div className="topbar__context"><span className="context-chip">{user.roleName}</span><span role="status">{ready===null?'API : vérification…':ready?'API connectée':'API indisponible'}</span><button type="button" onClick={logout}>Déconnexion</button>{(['fr','ar','en'] as Locale[]).map(l=><button key={l} type="button" aria-pressed={locale===l} onClick={()=>setLocale(l)}>{l.toUpperCase()}</button>)}</div></header>
  <div className="shell-body"><aside className="sidebar"><div className="sidebar__heading">Modules du pilote</div><nav className="sidebar__nav">{navigation.map(([id,label])=><button key={id} type="button" className={`nav-item ${section===id?'nav-item--active':''}`} onClick={()=>{setSection(id!);setError('');setNotice('');}}>{label}</button>)}</nav><p>Démo privée · {user.email}</p><p>Les modules non raccordés et les compteurs d’audit fictifs ne sont plus présentés comme opérationnels.</p></aside>
  <main className="content">{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {section==='monitoring'&&<MonitoringPanel key={user.id} token={token} user={user}/>}
  {section==='projects'&&<section className="panel"><div className="panel__header"><h1>Projets</h1><button type="button" onClick={()=>setCreate(!create)}>Créer un projet</button></div><p>Liste historique démo : les droits de suivi s’appliquent dans « Suivi opérationnel ». L’ancienne API projets n’est pas encore sécurisée pour la production.</p><label>Rechercher<input value={query} onChange={e=>setQuery(e.target.value)}/></label>{create&&<form className="form-grid" onSubmit={createProject}><label>Code<input required value={code} onChange={e=>setCode(e.target.value)}/></label><label>Nom<input required value={name} onChange={e=>setName(e.target.value)}/></label><button type="submit" disabled={busy}>Enregistrer</button></form>}<div className="table-wrap"><table><thead><tr><th>Code</th><th>Nom</th><th>Statut</th><th>Organisation</th></tr></thead><tbody>{projects.filter(p=>`${p.code} ${p.name}`.toLowerCase().includes(query.toLowerCase())).map(p=><tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td>{p.status}</td><td>{p.organization}</td></tr>)}</tbody></table></div></section>}
  {section==='kpis'&&<section className="panel"><h1>Catalogue KPI · {kpis.length} définitions</h1><p>Ce catalogue n’est pas un tableau de résultats. Cinq calculs sont raccordés dans le pilote.</p><div className="table-wrap"><table><thead><tr><th>Code</th><th>Nom</th><th>Famille</th><th>Phase</th><th>Responsable</th></tr></thead><tbody>{kpis.map(k=><tr key={k.id}><td>{k.kpi_id}</td><td>{k.name}</td><td>{k.family}</td><td>{k.phase}</td><td>{k.owner_role}</td></tr>)}</tbody></table></div></section>}
  {section==='rules'&&<section className="panel"><h1>Catalogue des règles · {validRules.length}</h1><p>Seules AL02, AL06 et AL13 sont exécutées dans ce pilote. Les autres restent des définitions. Les lignes hors AL01–AL17 sont masquées, pas supprimées de la base.</p><div className="table-wrap"><table><thead><tr><th>Code</th><th>Règle</th><th>Niveau</th><th>Condition</th></tr></thead><tbody>{validRules.map(r=><tr key={r.id}><td>{r.rule_id}</td><td>{r.name}</td><td>{r.level}</td><td>{r.readable_condition}</td></tr>)}</tbody></table></div></section>}
  </main></div></div>;
}
