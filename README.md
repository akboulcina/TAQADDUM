# TAQADDUM — Release 0

Prototype frontend de démonstration pour le pilotage stratégique d’un portefeuille de projets publics.

> **Avertissement** : cette application est un prototype. Les projets, budgets, indicateurs, alertes et conversations sont des données de démonstration déterministes. Ils ne représentent pas des données réelles du CNED.

## Stack

- React 18
- Vite 5
- JavaScript
- CSS personnalisé, sans Tailwind
- Aucun backend, base de données, API ou authentification réelle

## Commandes

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Fonctionnalités Release 0

- Shell applicatif de niveau entreprise
- Navigation fonctionnelle entre les modules
- Sélecteur de six personas de démonstration
- Interface en français, arabe (RTL) et anglais
- Jetons de design partagés
- Tableau de bord Direction Générale complet
- Données locales déterministes
- Points d’intégration isolés pour les modules à venir

## Architecture

```text
src/
├─ app/                 Shell, navigation, en-tête, routes
├─ context/             État global de démonstration et i18n
├─ data/                Contrat de données mock partagées
├─ components/          Composants UI réutilisables
├─ styles/              Design tokens et styles globaux
└─ features/            Modules isolés
```

## Contrats d’intégration

Les dossiers suivants sont réservés aux contributeurs des modules indépendants :

- `src/features/portfolio`
- `src/features/map`
- `src/features/kpi`
- `src/features/alerts`
- `src/features/collaboration`
- `src/features/project-details`
- `src/features/role-dashboards`

Chaque dossier contient un `README.md` décrivant le contrat attendu. Les contributeurs ne doivent pas modifier `src/app`, `src/context`, `src/styles` ou `src/data` sans coordination.
