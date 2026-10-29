export const executiveKpis = [
  { id: 'projects', labelKey: 'kpi.projects', value: '24', delta: '+3', positive: true },
  { id: 'budget', labelKey: 'kpi.budget', value: '38,6 Mds DZD', delta: '+8,2 %', positive: true },
  { id: 'execution', labelKey: 'kpi.execution', value: '62,8 %', delta: '+4,1 pts', positive: true },
  { id: 'alerts', labelKey: 'kpi.alerts', value: '7', delta: '+2', positive: false },
  { id: 'payments', labelKey: 'kpi.payments', value: '24,1 Mds DZD', delta: '+6,7 %', positive: true },
  { id: 'variance', labelKey: 'kpi.variance', value: '-3,4 %', delta: '-1,2 pt', positive: true }
];

export const executiveAlerts = [
  { id: 'ALR-118', severity: 'critical', project: 'PRJ-2031', title: 'Retard critique sur le lot structurel', detail: 'Le jalon de réception structurelle est dépassé de 23 jours. Une décision d’arbitrage est requise avant le 15 novembre.', owner: 'Nadia Cherif', date: '2026-10-27' },
  { id: 'ALR-116', severity: 'high', project: 'PRJ-2035', title: 'Dépendance fournisseur non résolue', detail: 'Le fournisseur d’infrastructure cloud n’a pas confirmé la livraison du lot 3. Impact estimé : 6 semaines.', owner: 'Yacine Hamdi', date: '2026-10-26' },
  { id: 'ALR-114', severity: 'high', project: 'PRJ-2015', title: 'Risque climatique sur les vestiges', detail: 'Les précipitations prévues peuvent affecter les zones de fouille et les équipements de numérisation.', owner: 'Sofiane Merabet', date: '2026-10-25' },
  { id: 'ALR-112', severity: 'medium', project: 'PRJ-2024', title: 'Écart de consommation budgétaire', detail: 'Le taux de consommation dépasse l’avancement physique de 9 points.', owner: 'Karim Benali', date: '2026-10-24' }
];

export const territorialSites = [
  { wilaya: 'Alger', x: 292, y: 118, progress: 72, status: 'onTrack' },
  { wilaya: 'Oran', x: 148, y: 122, progress: 58, status: 'atRisk' },
  { wilaya: 'Blida', x: 276, y: 132, progress: 96, status: 'completed' },
  { wilaya: 'Sétif', x: 372, y: 104, progress: 41, status: 'delayed' },
  { wilaya: 'Constantine', x: 408, y: 126, progress: 68, status: 'onTrack' },
  { wilaya: 'Annaba', x: 468, y: 116, progress: 79, status: 'onTrack' },
  { wilaya: 'Batna', x: 396, y: 152, progress: 74, status: 'onTrack' },
  { wilaya: 'Biskra', x: 352, y: 184, progress: 34, status: 'delayed' }
];
