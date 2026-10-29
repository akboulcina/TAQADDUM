# Collaboration module — integration contract

Reserved for the independently developed collaboration module.

## Expected export

```js
export default function CollaborationModule({ user, projects, activity }) {}
```

## Contract

- `user`: active demo persona.
- `projects`: project records for conversation context.
- `activity`: recent activity records.

The module should provide conversation, approval and activity surfaces without backend calls.
