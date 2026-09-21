CREATE SCHEMA IF NOT EXISTS documents;

CREATE TABLE IF NOT EXISTS documents.documents (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  document_code text,
  title_fr text,
  title_ar text,
  title_en text,
  document_type text NOT NULL,
  classification_code text NOT NULL,
  retention_code text,
  status text NOT NULL,
  current_version_id uuid,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  archived_at timestamptz,
  archived_by uuid,
  CONSTRAINT ck_documents__status
    CHECK (status IN (
      'draft',
      'submitted',
      'approved',
      'published',
      'superseded',
      'withdrawn',
      'archived'
    )),
  CONSTRAINT ck_documents__title_present
    CHECK (
      COALESCE(
        NULLIF(btrim(title_fr), ''),
        NULLIF(btrim(title_ar), ''),
        NULLIF(btrim(title_en), '')
      ) IS NOT NULL
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_documents__tenant_id__document_code
  ON documents.documents (tenant_id, document_code)
  WHERE document_code IS NOT NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_documents__tenant_id__status__updated_at
  ON documents.documents (tenant_id, status, updated_at DESC)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS documents.document_versions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  document_id uuid NOT NULL,
  version_number integer NOT NULL,
  object_key text NOT NULL,
  content_hash text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_status text NOT NULL,
  scan_status text,
  ocr_status text,
  immutable_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT fk_document_versions__document_id__documents
    FOREIGN KEY (document_id)
    REFERENCES documents.documents(id),
  CONSTRAINT ck_document_versions__storage_status
    CHECK (storage_status IN (
      'pending',
      'uploaded',
      'verified',
      'failed'
    )),
  CONSTRAINT ck_document_versions__scan_status
    CHECK (
      scan_status IS NULL OR scan_status IN (
        'pending',
        'clean',
        'infected',
        'failed'
      )
    ),
  CONSTRAINT ck_document_versions__ocr_status
    CHECK (
      ocr_status IS NULL OR ocr_status IN (
        'pending',
        'completed',
        'failed'
      )
    ),
  CONSTRAINT uq_document_versions__document_id__version_number
    UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS ix_document_versions__tenant_id__document_id
  ON documents.document_versions (tenant_id, document_id);

CREATE TABLE IF NOT EXISTS documents.evidence_links (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  document_version_id uuid NOT NULL,
  target_context text NOT NULL,
  target_aggregate_type text NOT NULL,
  target_aggregate_id uuid NOT NULL,
  relation_type text NOT NULL,
  rationale text,
  asserted_at timestamptz NOT NULL DEFAULT now(),
  asserted_by uuid NOT NULL,
  withdrawn_at timestamptz,
  withdrawn_by uuid,
  withdrawal_reason text,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT fk_evidence_links__document_version_id__document_versions
    FOREIGN KEY (document_version_id)
    REFERENCES documents.document_versions(id),
  CONSTRAINT ck_evidence_links__relation_type
    CHECK (relation_type IN (
      'supports',
      'approves',
      'measures',
      'reports',
      'justifies',
      'contradicts',
      'supersedes',
      'attachment'
    ))
);

CREATE INDEX IF NOT EXISTS ix_evidence_links__tenant_id__target
  ON documents.evidence_links (
    tenant_id,
    target_context,
    target_aggregate_type,
    target_aggregate_id
  )
  WHERE withdrawn_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_evidence_links__document_version_id
  ON documents.evidence_links (document_version_id);

CREATE OR REPLACE FUNCTION documents.forbid_document_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'document version % is immutable after creation',
    OLD.id
    USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS trg_document_versions__forbid_mutation
  ON documents.document_versions;

CREATE TRIGGER trg_document_versions__forbid_mutation
BEFORE UPDATE OR DELETE ON documents.document_versions
FOR EACH ROW
EXECUTE FUNCTION documents.forbid_document_version_mutation();

CREATE OR REPLACE FUNCTION documents.set_document_version_immutable_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.immutable_at IS NULL THEN
    NEW.immutable_at := COALESCE(NEW.created_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_versions__set_immutable_at
  ON documents.document_versions;

CREATE TRIGGER trg_document_versions__set_immutable_at
BEFORE INSERT ON documents.document_versions
FOR EACH ROW
EXECUTE FUNCTION documents.set_document_version_immutable_at();