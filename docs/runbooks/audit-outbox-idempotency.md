# Audit, outbox et idempotence

## Audit immuable

`audit.audit_records` est append-only. Le trigger `trg_audit_records__forbid_mutation` bloque UPDATE et DELETE. `audit.compute_record_hash` calcule un SHA-256 sur le hash précédent et les champs canoniques ; l’application doit fournir le hash précédent et persister le hash résultant.

## Endpoint d'audit

`GET /v1/audit/records` utilise `PostgresAuditRepository`. Le filtre `tenant_id` est obligatoire dans la couche d'accès : s'il est fourni il doit correspondre au contexte, sinon le contexte est utilisé. `organization_id` ne peut viser que l'organisation active. Les autres filtres sont paramétrés. Les snapshots avant/après et métadonnées ne sont jamais renvoyés. La pagination utilise un curseur basé sur `occurred_at`.

L'autorisation requiert `audit.read`; un refus retourne Problem JSON 403.

## Outbox

`platform.outbox_events` est écrit dans la même transaction que la mutation source. Le worker PR-004 simule la publication par un log et marque `published_at`; aucun broker réel n'est utilisé.

## Idempotence

`platform.api_idempotency_keys` impose une clé unique par tenant, acteur, opération et clé. Une même requête doit réutiliser son résultat ; une empreinte différente est une erreur de réutilisation. `platform.processed_events` empêche le rejeu par `(consumer_name,event_id)`.
