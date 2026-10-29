# Role-specific dashboards

Named export:

```js
import { RoleDashboard } from './features/role-dashboards/RoleDashboard.jsx';
```

Props: `user`, `projects`, `kpis`, `alerts`.

## Role mapping

- `dg` — Direction Générale
- `pmo` — PMO Central
- `mo` — Maître d’Ouvrage
- `pm` — Chef de Projet
- `finance` — Responsable Financier
- `territorial` — Responsable Territorial

Unknown roles receive a graceful general-portfolio fallback. Assignment is respected when `project.manager` matches `user.name`; otherwise, clearly labeled demonstration scope is used. All values are simulated and must not be presented as official CNED data.
