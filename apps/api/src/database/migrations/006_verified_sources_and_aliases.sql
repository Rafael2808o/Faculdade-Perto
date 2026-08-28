CREATE TABLE IF NOT EXISTS institution_aliases (
  id bigserial PRIMARY KEY,
  institution_id bigint NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  source_record_id bigint REFERENCES source_records(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, normalized_alias)
);

CREATE INDEX IF NOT EXISTS institution_aliases_lookup_idx
  ON institution_aliases (normalized_alias);

ALTER TABLE sources ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS trust_tier smallint;
ALTER TABLE sources ADD COLUMN IF NOT EXISTS geographic_scope text;

UPDATE sources SET source_type='censo_oficial',trust_tier=1,geographic_scope='nacional'
WHERE publisher='INEP' AND source_type IS NULL;

INSERT INTO institution_aliases(institution_id,alias,normalized_alias)
SELECT id,'Fundação Educacional de Andradina','fundacao educacional de andradina'
FROM institutions WHERE inep_code IN ('1844','1623')
ON CONFLICT(institution_id,normalized_alias) DO NOTHING;

INSERT INTO institution_aliases(institution_id,alias,normalized_alias)
SELECT id,'FEA','fea' FROM institutions WHERE inep_code IN ('1844','1623')
ON CONFLICT(institution_id,normalized_alias) DO NOTHING;
