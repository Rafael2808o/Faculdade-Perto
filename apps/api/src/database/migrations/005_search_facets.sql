SET statement_timeout = '15min';

ALTER TABLE course_catalog_records ADD COLUMN IF NOT EXISTS daytime_seats integer;
ALTER TABLE course_catalog_records ADD COLUMN IF NOT EXISTS nighttime_seats integer;

UPDATE course_catalog_records
SET daytime_seats = CASE
      WHEN raw_payload->>'QT_VG_TOTAL_DIURNO' ~ '^[0-9]+$' THEN (raw_payload->>'QT_VG_TOTAL_DIURNO')::integer
      ELSE NULL
    END,
    nighttime_seats = CASE
      WHEN raw_payload->>'QT_VG_TOTAL_NOTURNO' ~ '^[0-9]+$' THEN (raw_payload->>'QT_VG_TOTAL_NOTURNO')::integer
      ELSE NULL
    END
WHERE daytime_seats IS NULL OR nighttime_seats IS NULL;

CREATE INDEX IF NOT EXISTS catalog_daytime_seats_idx
  ON course_catalog_records (daytime_seats) WHERE daytime_seats > 0;
CREATE INDEX IF NOT EXISTS catalog_nighttime_seats_idx
  ON course_catalog_records (nighttime_seats) WHERE nighttime_seats > 0;
CREATE INDEX IF NOT EXISTS catalog_facets_idx
  ON course_catalog_records (modality, degree, dimension, free_indicator, census_seats);
