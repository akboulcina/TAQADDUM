# ADR-002 — Mock OIDC local compatible avec OIDC futur

## Décision
Un mock OIDC est autorisé uniquement en local et dans les tests. Il est interdit en production.

## Claims normalisés
`actor_id`, `actor_type`, `tenant_id`, `organization_id`, `roles`, `permissions`, `locale`, `session_id` et `amr`.

## Migration future
Une interface `IdentityProvider` permettra de remplacer l’adapter local par un provider OIDC réel. Les règles d’autorisation ne dépendront pas des noms de claims propres au fournisseur.

## Conséquences
Le démarrage en environnement production doit échouer si le mock est sélectionné. Aucun secret réel ni token durable n’est stocké.
