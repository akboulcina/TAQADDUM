# Alerts & Risks module

Named export:

```js
import { AlertsModule } from './features/alerts/AlertsModule.jsx';
```

Props: `alerts`, `projects`, `user`.

The module combines supplied alerts with locally derived operational alerts based on project due dates, budget values, progress and risk status. Acknowledge, resolve and dismiss actions use local component state only. No API call or persistence is performed.
