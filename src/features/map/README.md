# Map module — integration contract

Reserved for the independently developed interactive Algeria map module.

## Expected export

```js
export default function AlgeriaProjectMap({ sites, projects, selectedWilaya, onSelectWilaya }) {}
```

## Contract

- `sites`: territorial site objects with `wilaya`, `x`, `y`, `progress`, `status`.
- `projects`: project records for filtering and tooltips.
- `selectedWilaya`: currently selected wilaya name or `null`.
- `onSelectWilaya(wilayaName)`: selection callback.

Do not modify the application shell or shared data contract.
