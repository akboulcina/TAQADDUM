import { useEffect, useState, type FormEvent } from 'react';
const base = import.meta.env.VITE_API_BASE_URL ?? '';
export const demoContext = { 'X-Tenant-Id': '68b04727-b370-4fae-a518-a5f74280f2f8', 'X-Organization-Id': '078c5634-6903-4476-af7c-a252a713e378' };
type User = { id: string; roleCode: string };
type Project = { id: string; code: string; name: string; can_submit: boolean; can_validate: boolean };
type Submission = { id: string; submitted_by: string; reference_date: string; status: string; source_data: Record<string, unknown>; comment: string };
type Results = { snapshot: { reference_date: string; validated_at: string } | null; kpis: { code: string; name: string; value: string | number | null; unit: string; status: string }[]; alerts: { id: string; code: string; name: string; level: string; action: string }[] };
const labels = [['performedValue','Valeur des travaux réalisés (DA)'],['totalEstimatedCost','Coût total estimé du projet (DA)'],['elapsedDays','Jours écoulés depuis le démarrage'],['currentDurationDays','Délai en vigueur (jours)'],['initialDurationDays','Délai initial (jours)'],['releasedArea','Emprise libérée (m²)'],['requiredArea','Emprise requise à cette date (m²)']] as const;
const statuses: Record<string,string> = { green:'Vert', orange:'Orange', red:'Rouge', information:'Information', not_calculable:'Non calculable' };
export function MonitoringPanel({ token, user }: { token: string; user: User }) {
  const supported = ['MO','CNED_PMO','CNED_DIRECTION'].includes(user.roleCode);
  const [projects,setProjects] = useState<Project[]>([]);
  const [projectId,setProjectId] = useState('');
  const [submissions,setSubmissions] = useState<Submission[]>([]);
  const [results,setResults] = useState<Results | null>(null);
  const [values,setValues] = useState<Record<string,string>>({});
  const [date,setDate] = useState(new Date().toISOString().slice(0,10));
  const [comment,setComment] = useState('');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(false);
  const [revision,setRevision] = useState(0);
  const project = projects.find(p=>p.id===projectId);
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}/v1/monitoring/${path}`, { ...init, headers: { ...demoContext, Authorization:`Bearer ${token}`, 'Content-Type':'application/json' } });
    const payload = await response.json();
    if (!response.ok) throw new Error(response.status===401 ? 'Session expirée ou backend redémarré : reconnectez-vous.' : payload.detail ?? `Erreur HTTP ${response.status}`);
    return payload;
  }
  useEffect(()=>{
    if (!supported) return;
    let active=true; setError('');
    request('projects').then(p=>{ if(active){setProjects(p.items); setProjectId(current=>p.items.some((v:Project)=>v.id===current)?current:(p.items[0]?.id??''));} }).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[token,supported]);
  useEffect(()=>{
    setResults(null); setSubmissions([]); setError('');
    if (!projectId) return;
    let active=true;
    async function load(){
      if(active)setLoading(true);
      try {
        const r = await request(`projects/${projectId}/results`);
        const s = user.roleCode==='CNED_DIRECTION' ? {items:[]} : await request(`projects/${projectId}/updates`);
        if(active){setResults(r);setSubmissions(s.items);setError('');}
      } catch(e){ if(active)setError(e instanceof Error?e.message:'Chargement impossible'); }
      finally {if(active)setLoading(false);}
    }
    void load(); const timer=setInterval(()=>void load(),30000);
    return ()=>{active=false;clearInterval(timer);};
  },[token,projectId,revision,user.roleCode]);
  useEffect(()=>{setValues({});setComment('');setNotice('');},[projectId]);
  async function submit(event: FormEvent){
    event.preventDefault(); if(busy)return; setBusy(true);setError('');setNotice('');
    try {
      const sourceData: Record<string,number|boolean>={};
      for(const [key] of labels) if(values[key]?.trim()) sourceData[key]=Number(values[key]);
      for(const key of ['unblockPlanValidated','projectCompleted']) if(values[key]) sourceData[key]=values[key]==='true';
      await request(`projects/${projectId}/updates`,{method:'POST',body:JSON.stringify({referenceDate:date,sourceData,comment})});
      setNotice('Situation enregistrée. Elle attend la validation PMO ; les KPI publiés ne sont pas encore modifiés.');setRevision(v=>v+1);
    } catch(e){setError(e instanceof Error?e.message:'Saisie impossible');}finally{setBusy(false);}
  }
  async function validate(id:string){
    if(busy)return;setBusy(true);setError('');setNotice('');
    try{await request(`projects/${projectId}/updates/${id}/validate`,{method:'POST'});setNotice('Situation validée : résultats calculés et enregistrés.');setRevision(v=>v+1);}
    catch(e){setError(e instanceof Error?e.message:'Validation impossible');}finally{setBusy(false);}
  }
  if(!supported)return <section className="panel"><h2>Suivi opérationnel</h2><p>Ce premier pilote concerne MO, PMO et Direction. Les interfaces BET, Finance et Contractant restent à raccorder.</p></section>;
  return <section className="panel" aria-label="Suivi opérationnel">
    <div className="panel__header"><h2>Suivi opérationnel des projets</h2><button type="button" disabled={busy||loading} onClick={()=>setRevision(v=>v+1)}>Actualiser</button></div>
    <p>Pilote : 5 KPI et 3 règles. Seuils provisoires. Les champs vides restent inconnus ; ils ne valent pas zéro.</p>
    {error&&<p role="alert" style={{color:'#a51d2d'}}>{error}</p>}{notice&&<p role="status">{notice}</p>}
    <label>Projet<select value={projectId} onChange={e=>setProjectId(e.target.value)} disabled={busy}><option value="">Sélectionner</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></label>
    {!projects.length&&!error&&<p>Aucun projet accessible. Les comptes MO/PMO doivent être explicitement affectés à un projet.</p>}
    {project?.can_submit&&<form onSubmit={submit} className="form-grid">
      <h3>Nouvelle situation MO</h3>
      <label>Date de référence<input type="date" required max={new Date().toISOString().slice(0,10)} value={date} onChange={e=>setDate(e.target.value)} /></label>
      {labels.map(([key,label])=><label key={key}>{label}<input type="number" min="0" step="any" value={values[key]??''} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/></label>)}
      {([['unblockPlanValidated','Plan de déblocage validé'],['projectCompleted','Projet achevé']] as const).map(([key,label])=><label key={key}>{label}<select value={values[key]??''} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}><option value="">Non renseigné</option><option value="true">Oui</option><option value="false">Non</option></select></label>)}
      <label>Commentaire et référence du justificatif<textarea required maxLength={4000} value={comment} onChange={e=>setComment(e.target.value)}/></label>
      <p>Utiliser les données consolidées du projet, une même unité monétaire et des durées en jours. Aucun téléversement de justificatif dans ce lot.</p>
      <button type="submit" disabled={busy}>{busy?'Enregistrement…':'Soumettre à la PMO'}</button>
    </form>}
    {projectId&&user.roleCode!=='CNED_DIRECTION'&&<><h3>Situations soumises</h3><div className="table-wrap"><table><thead><tr><th>Date</th><th>État</th><th>Données et commentaire</th><th>Action</th></tr></thead><tbody>{submissions.map(s=><tr key={s.id}><td>{s.reference_date.slice(0,10)}</td><td>{s.status}</td><td><details><summary>Consulter la saisie</summary><p>{s.comment}</p><pre>{JSON.stringify(s.source_data,null,2)}</pre></details></td><td>{project?.can_validate&&s.status==='submitted'&&s.submitted_by!==user.id&&<button type="button" disabled={busy} onClick={()=>void validate(s.id)}>Valider et calculer</button>}</td></tr>)}</tbody></table></div><p>Validation indépendante : auteur différent. Le pilote refuse une situation de plus de 31 jours.</p></>}
    {projectId&&<><h3>Dernière situation validée</h3>{loading&&<p role="status">Actualisation…</p>}{results&&!results.snapshot&&<p>Aucune situation validée : aucun résultat publié.</p>}{results?.snapshot&&<><p>Référence : {results.snapshot.reference_date.slice(0,10)} · validation : {new Date(results.snapshot.validated_at).toLocaleString()}</p><div className="table-wrap"><table><thead><tr><th>KPI</th><th>Valeur</th><th>Statut</th></tr></thead><tbody>{results.kpis.map(k=><tr key={k.code}><td>{k.code} — {k.name}</td><td>{k.value===null?'—':Number(k.value).toLocaleString('fr-FR',{maximumFractionDigits:3})} {k.value===null?'':k.unit}</td><td>{statuses[k.status]??k.status}</td></tr>)}</tbody></table></div><h3>Alertes déclenchées sur cette situation</h3>{results.alerts.map(a=><article key={a.id}><h4>{a.code} · {a.level} · {a.name}</h4><p>{a.action}</p></article>)}{!results.alerts.length&&<p>Aucune alerte déclenchée parmi les trois règles du pilote. Cela ne garantit pas l’absence de risque : des données ou des règles peuvent manquer.</p>}<p>Résultats figés à la date indiquée ; pas encore de recalcul quotidien. Actualisation de l’affichage toutes les 30 secondes.</p></>}</>}
  </section>;
}
