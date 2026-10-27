# Credential checks and non-destructive remediation

## Scope

Run from the repository root:

```bash
python3 -m unittest discover -s scripts/security -p 'test_*.py' -v
python3 scripts/security/scan_credentials.py
```

The checker uses Python standard library only and git ls-files. It reads tracked
working-tree text and OOXML password/token columns. Reports include path,
line/cell and finding type only, never a secret value or source snippet.
A detection exits 1; inventory/parsing errors exit 2; no findings in supported
inputs exits 0. Unsupported paths are listed explicitly. Review false positives;
do not suppress entire directories or add broad allowlists to get green CI.
The workflow intentionally fails while tracked shared credentials remain.

This is a targeted heuristic guard, not a complete secret scanner, Git-history
scan, credential validator, dependency vulnerability scan or proof of safety.
It does not recognize every token format, credential stored outside a recognized
column or arbitrary binary. A successful run cannot certify the repository clean.
History review and a maintained general-purpose scanner remain required.
The GitHub targeted scanner could not run because the connector reported
GitHub Advanced Security unavailable for this repository; no subscription change
or security feature enablement was performed.

## Public workbook decision

Owner approved the original business referential workbook for public distribution
on 2026-10-27. This is not a password exemption. Credential columns in generated
import workbooks must be removed or regenerated independently of business data.
Do not reproduce real secrets in tests, issue bodies, reports, logs or chat.

## Remediation order

1. Inspect paths and locations locally without publishing secret values.
2. Separate schema migrations from optional account provisioning. Provision new
   passwords through environment/private operator input, never committed Excel.
3. Inventory every client of shared database/object-store credentials and back up
   before coordinated rotation. Changing Compose initialization environment alone
   does not rotate credentials in an existing database volume. Never remove the
   volume to force rotation.
4. Rotate exposed live credentials; revoke existing sessions as supported; update
   client secret stores. Verify application readiness and least privilege.
5. Remove credential literals from tracked configuration/seeds and generated
   workbooks through a reviewed change, preserving business data and author IDs.
6. Rerun targeted and general-purpose/history checks. Coordinate any Git-history
   rewrite separately with owner approval, collaborators and backups. Deleting
   current literals does not revoke a credential or remove historical copies.

No account, password, authorization, dataset or repository visibility is changed
by running this checker. No findings have been waived by the public-data decision.
