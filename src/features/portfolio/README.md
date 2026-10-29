# Portfolio module — integration contract

Reserved for the independently developed project-portfolio module.

## Expected export

```js
export default function PortfolioModule({ projects, user, onSelectProject }) {}
```

## Contract

- `projects`: array from `src/data/projects.js`.
- `user`: active demo persona from `AppContext`.
- `onSelectProject(projectId)`: callback for navigation to project details.

Do not modify `src/app`, `src/context`, `src/styles`, or `src/data`.
