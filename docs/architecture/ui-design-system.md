# UI design system

## Tokens

Les tokens sémantiques sont définis dans `packages/design-tokens/src/tokens.css`.
Les composants consomment uniquement les variables `--color-*`, `--space-*`,
`--font-*`, `--radius-*`, `--control-*` et `--focus-*`.

Les couleurs et espacements ne doivent pas être codés directement dans les
composants.

## Ajouter un composant

1. Créer un fichier dans `packages/ui/src/components/`.
2. Exposer une API TypeScript accessible et documentée.
3. Utiliser les tokens CSS et les propriétés logiques.
4. Ajouter une story avec les états principaux.
5. Ajouter des tests de rendu, interaction et clavier.
6. Vérifier le focus visible et les noms accessibles.

## i18n et RTL

`packages/i18n-ui` fournit `useTranslation`, `messages` et `getDirection`.
Les locales supportées sont `fr`, `ar` et `en`.
La locale arabe utilise `dir="rtl"` et la police arabe déclarée par les tokens.

Les styles doivent préférer `margin-inline`, `padding-inline`, `inset-inline`,
`block-size` et `inline-size` aux propriétés physiques.

## Storybook

Les stories sont placées à côté des composants dans
`packages/ui/src/components/*.stories.tsx`.
Chaque story doit couvrir au minimum un état nominal et un état particulier,
comme loading, warning, dismissible ou RTL.

Lancer Storybook :

```bash
make storybook
```

## Accessibilité

Les composants utilisent des éléments HTML natifs, des labels explicites,
`aria-busy`, `aria-pressed`, `aria-live` et `:focus-visible`.
Les tests doivent vérifier la navigation clavier et les noms accessibles.

## Limitations

PR-008 fournit uniquement une UI de démonstration.
Il n'y a pas d'écran métier complexe, de backend réel ni d'appel API réel.
