# Interactive Algeria Project Map

This module provides the named export `AlgeriaProjectMap` for integration into the TAQADDUM shell.

```js
import { AlgeriaProjectMap } from './features/map/AlgeriaProjectMap.jsx';
```

## Props

| Prop | Type | Description |
|---|---|---|
| `sites` | Array | Optional territorial records. Supports `wilaya`, `latitude`/`longitude`, or legacy `x`/`y` map coordinates. |
| `projects` | Array | Project records. Supports optional `latitude`/`longitude`, `lat`/`lon`, or `lat`/`lng`. |
| `selectedWilaya` | String \| null | Currently selected wilaya. |
| `onSelectWilaya` | Function | Called with a wilaya name or `null`. |

## Behavior

- Offline SVG map based on a simplified geographic outline of Algeria.
- Equirectangular projection from longitude/latitude to map coordinates.
- Wilaya selection, project selection, status and sector filters, zoom, and pan.
- Projects without usable coordinates are excluded from map placement and reported in the detail panel.
- No basemap service, network request, or project coordinate is invented.

All displayed project, budget, progress and alert values are simulated demonstration data and must not be presented as official CNED data.
