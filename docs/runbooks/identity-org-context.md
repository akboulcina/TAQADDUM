# Identity, organisation et contexte de commande

## Mock identity

Le `MockIdentityProvider` est autorisé uniquement avec `NODE_ENV=local` ou `NODE_ENV=test`. Il ne crée aucun mot de passe ni token durable. En environnement production, il lève une erreur.

## Claims normalisés

Les claims comprennent `sub`, `actor_id`, `actor_type`, `tenant_id`, `organization_id`, `roles`, `permissions`, `locale`, `session_id` et `correlation_id`. Les headers de développement `X-Tenant-Id`, `X-Organization-Id`, `X-Actor-Id` et `X-Correlation-Id` servent uniquement au mock.

## Résolution du contexte

Le middleware doit résoudre l’identité, vérifier tenant et membership active, générer `request_id`, puis définir transactionnellement `app.tenant_id`, `app.organization_id`, `app.actor_id`, `app.correlation_id` et `app.request_id` avec `set_config(..., true)`. Le contexte est nettoyé à la fin de la transaction.

## Sessions applicatives et liaison d'identité

Les connexions par mot de passe de l'API utilisent `public.users`. Une session n'est créée que si le compte est actif et possède une liaison explicite dans `identity.auth_user_links` vers un `identity.users` actif. Les UUID des deux tables ne sont pas interchangeables et aucune liaison n'est générée à partir d'une égalité d'UUID ou d'une correspondance d'e-mail. La migration `20261028_security_identity_links.sql` crée la table vide, sans reprise automatique des comptes existants.

Le bearer est aléatoire; seul son SHA-256 est stocké dans `identity.sessions`. La durée maximale est de huit heures. `POST /v1/auth/logout` révoque la session courante. Chaque route métier vérifie à nouveau la session, l'état actif des deux comptes, le tenant, l'organisation, le membership actif/non expiré et, pour les projets, la permission demandée. Les projets du pilote de suivi nécessitent en plus une ligne `monitoring.project_members`; le rôle Direction ne contourne pas cette affectation.

Avant toute liaison ou attribution, vérifier l'identité de la personne et la portée métier via le processus d'administration autorisé. L'absence de membership ou de permission doit rester un refus; ne pas peupler les tables avec les comptes de démonstration ni réutiliser les rôles publics comme autorité organisationnelle. Les tests PostgreSQL d'intégration n'acceptent que `SECURITY_TEST_DATABASE_URL` pointant sur `127.0.0.1:55432/taqaddum_security_test`; ils ne consomment jamais `DATABASE_URL` comme repli.

## Préparation de déploiement et récupération

Inventaire read-only du 2026-10-28 sur la base applicative: six comptes dans `public.users`, dont `direction@taqaddum.dz` actif avec le rôle public `CNED_DIRECTION`; zéro `identity.users`, zéro ligne `org.memberships`, zéro organisation dans `org.organizations` et zéro permission liée dans `identity.role_permissions`. Le seul projet retourné est `001` (`projet1`, `draft`), sans organisation vérifiable; aucune affectation de projet n'existe. Il n'y a donc actuellement aucune relation d'identité ou d'appartenance à migrer, et l'application doit refuser les connexions sécurisées jusqu'à provisionnement approuvé.

Ordre futur, après approbation explicite et hors de cette intervention:

1. Geler les changements d'identité, de memberships et de projets; inventorier le schéma et confirmer les personnes et portées via une source administrative fiable. Ne jamais rapprocher par e-mail ou égalité d'UUID.
2. Créer une sauvegarde complète PostgreSQL au format custom, la chiffrer et la stocker hors du conteneur; contrôler son contenu avec `pg_restore --list` et effectuer une répétition de restauration vers une base séparée. Ne pas supprimer ni recréer le volume existant.
3. Vérifier les prérequis `public.users`, `public.roles`, `public.user_roles`, `identity.*`, `org.*`, les rôles SQL et les droits du migrator. Appliquer uniquement `20261028_security_identity_links.sql` avec arrêt à la première erreur; ne pas rejouer le glob `make migrate` sur la base peuplée.
4. Vérifier les politiques RLS, les grants et l'absence de liens automatiques. Déployer ensuite le code compatible, puis vérifier health/readiness et les refus attendus avant toute création de compte lié.
5. Après approbation nominative, provisionner dans une transaction auditée le compte `identity.users`, le lien explicite, le membership tenant/organisation, le rôle et les permissions minimales, puis les seules affectations projet approuvées. Vérifier en session neuve les autorisations et refus inter-portée.

Si migration ou vérification échoue, interrompre le déploiement et garder les accès refusés. Ne pas rétablir l'ancienne politique RLS faible. Restaurer la sauvegarde dans une base de récupération séparée, comparer et valider avant toute bascule planifiée; conserver la base originale intacte jusqu'à approbation explicite de la récupération.

### Faits vérifiés

- `direction@taqaddum.dz` est le seul compte public actif recensé et porte actuellement le rôle public `CNED_DIRECTION`.
- La base applicative ne contient aucune identité canonique, organisation, membership, affectation projet ou permission liée.
- Le projet `001` existe, mais son rattachement à une organisation n'est pas établi. Il n'est ni proposé ni inclus dans une affectation.
- Le parcours HTTP complet est validé uniquement avec des identités synthétiques dédiées au test; cela ne constitue pas un accès réel ni une validation visuelle du déploiement.

### Informations métier manquantes

- Confirmation du titulaire et du compte à utiliser, ou remplacement par un compte institutionnel vérifié.
- Identifiants/code du tenant et de l'organisation établis par une source autorisée.
- Rôle métier et permissions approuvés pour cette personne.
- Liste de projets dont le rattachement au tenant et à l'organisation aura été confirmé; aucun projet n'est proposé à ce stade.

### Changements d'accès envisagés, non exécutés

Après décision et vérification indépendantes uniquement: créer le lien explicite entre compte public et identité canonique, attribuer le membership organisationnel confirmé, les seules permissions approuvées, et des affectations explicites aux seuls projets confirmés. Une proposition de moindre privilège pour une Direction serait lecture seule (`projects.read`, sans création ni validation), mais ce rôle n'est pas encore approuvé. Aucun de ces accès n'est créé par cette préparation.

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
