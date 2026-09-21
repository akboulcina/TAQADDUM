# Identity, organisation et contexte de commande

## Mock identity

Le `MockIdentityProvider` est autorisé uniquement avec `NODE_ENV=local` ou `NODE_ENV=test`. Il ne crée aucun mot de passe ni token durable. En environnement production, il lève une erreur.

## Claims normalisés

Les claims comprennent `sub`, `actor_id`, `actor_type`, `tenant_id`, `organization_id`, `roles`, `permissions`, `locale`, `session_id` et `correlation_id`. Les headers de développement `X-Tenant-Id`, `X-Organization-Id`, `X-Actor-Id` et `X-Correlation-Id` servent uniquement au mock.

## Résolution du contexte

Le middleware doit résoudre l’identité, vérifier tenant et membership active, générer `request_id`, puis définir transactionnellement `app.tenant_id`, `app.organization_id`, `app.actor_id`, `app.correlation_id` et `app.request_id` avec `set_config(..., true)`. Le contexte est nettoyé à la fin de la transaction.

## Fixtures

```bash
make up
make migrate
make seed-identity
```

Les fixtures `demo-tenant`, `demo-org`, `admin@example.test` et `user@example.test` sont synthétiques, idempotentes et localisées FR/AR/EN.

## Isolation

Toute requête doit appliquer le tenant et l’organisation du contexte. Tester avec deux tenants/organisations et vérifier qu’un contexte ne lit pas les lignes de l’autre. Une requête sans tenant ou sans membership active doit être rejetée.

## Limitations

Cette PR ne fournit pas OIDC réel, gestion de mots de passe, approbation métier, endpoint métier ou écran UI complexe. Les routes techniques peuvent utiliser une projection mockée en local/test jusqu’à l’intégration du repository PostgreSQL complet.
