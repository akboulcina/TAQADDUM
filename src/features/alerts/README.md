# Alerts & Risks module — integration contract

Reserved for the independently developed alerts and risk module.

## Expected export

```js
export default function AlertsModule({ alerts, projects, user }) {}
```

## Contract

- `alerts`: alert records with `id`, `severity`, `project`, `title`, `detail`, `owner`, `date`.
- `projects`: project records for contextual filtering.
- `user`: active demo persona.

Do not implement navigation or routing inside this module.
