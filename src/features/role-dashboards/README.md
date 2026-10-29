# Role dashboards — integration contract

Reserved for role-specific dashboard compositions.

## Expected export

```js
export default function RoleDashboard({ user, projects, kpis, alerts }) {}
```

## Contract

- `user.id` values: `dg`, `pmo`, `mo`, `pm`, `finance`, `territorial`.
- The component must adapt priorities and visible metrics to the active persona.
- Use shared mock data; do not introduce backend dependencies.
