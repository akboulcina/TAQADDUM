# KPI & Performance module — integration contract

Reserved for the independently developed KPI and performance module.

## Expected export

```js
export default function KpiModule({ projects, kpis, user }) {}
```

## Contract

- `projects`: project records.
- `kpis`: executive KPI definitions and values.
- `user`: active demo persona.

The module must remain frontend-only and consume deterministic mock data.
