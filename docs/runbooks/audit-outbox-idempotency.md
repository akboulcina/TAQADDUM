# Audit, outbox et idempotence

## Audit immuable

`audit.audit_records` est append-only. Le trigger `trg_audit_records__forbid_mutation` bloque UPDATE et DELETE. `audit.compute_record_hash` calcule un SHA-256 sur le hash précédent et les champs canoniques de l'événement ; l'application doit fournir le hash précédent et persister le hash résultant.

## Outbox

`platform.outbox_events` est écrit dans la même transaction que la mutation source. Le worker PR-004 simule la publication par un log et marque `published_at`; aucun broker réel n'est utilisé. Les tentatives sont comptées et les erreurs conservées.

## Idempotence

`platform.api_idempotency_keys` impose une clé unique par tenant, acteur, opération et clé. Une même requête doit réutiliser son résultat ; une empreinte différente est une erreur de réutilisation.

`platform.processed_events` empêche le rejeu d'un même événement par un consommateur grâce à `(consumer_name,event_id)`.

## Endpoint audit

`GET /v1/audit/records` exige `audit.read`, applique le contexte tenant/organisation et accepte les filtres et la pagination curseur. Les réponses ne doivent jamais exposer les snapshots sensibles.

## Limitations

Le worker ne publie pas vers un broker. La route API est un squelette technique jusqu'à l'intégration d'un repository PostgreSQL et d'une authentification réelle.
