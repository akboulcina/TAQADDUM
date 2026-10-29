# Project details module — integration contract

Reserved for the independently developed project-details module.

## Expected export

```js
export default function ProjectDetailsModule({ project, user, onBack }) {}
```

## Contract

- `project`: a single project record.
- `user`: active demo persona.
- `onBack()`: returns to the previous portfolio or dashboard view.

Expected internal surfaces: project header, milestone timeline, financial panel and document list.
