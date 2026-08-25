-- Safe upgrade path for databases created before the national-catalog redesign.
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS reference_latitude double precision;
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS reference_longitude double precision;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS raw_payload jsonb;
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE poles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE poles ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE course_catalog_records ADD COLUMN IF NOT EXISTS census_seats numeric;
ALTER TABLE course_catalog_records ADD COLUMN IF NOT EXISTS enrolled numeric;
ALTER TABLE course_catalog_records ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS municipalities_reference_coordinates_idx
  ON municipalities (reference_latitude, reference_longitude)
  WHERE reference_latitude IS NOT NULL AND reference_longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_course_name_lookup_idx ON course_catalog_records (course_id, census_year);
CREATE INDEX IF NOT EXISTS catalog_institution_lookup_idx ON course_catalog_records (institution_id, census_year);
