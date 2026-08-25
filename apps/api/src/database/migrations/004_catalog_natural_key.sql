-- CockroachDB follows PostgreSQL's default NULL semantics for UNIQUE indexes.
-- This explicit key keeps the Censo upsert idempotent on both engines.
ALTER TABLE course_catalog_records ADD COLUMN IF NOT EXISTS natural_key text;

UPDATE course_catalog_records
SET natural_key = concat(
  snapshot_id::text, '|', institution_id::text, '|', inep_course_code, '|',
  dimension, '|', COALESCE(municipality_id::text, '∅'), '|',
  COALESCE(degree, '∅'), '|', modality, '|', COALESCE(academic_level, '∅')
)
WHERE natural_key IS NULL;

ALTER TABLE course_catalog_records ALTER COLUMN natural_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS course_catalog_records_natural_key_idx
  ON course_catalog_records (natural_key);
