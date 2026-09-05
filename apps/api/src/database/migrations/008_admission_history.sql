CREATE TABLE IF NOT EXISTS admission_history (
  id bigserial PRIMARY KEY,
  natural_key text NOT NULL UNIQUE,
  institution_id bigint NOT NULL REFERENCES institutions(id),
  municipality_id bigint REFERENCES municipalities(id),
  course_name text NOT NULL,
  course_code text,
  campus_name text,
  degree text,
  shift text NOT NULL,
  program text NOT NULL,
  edition text NOT NULL,
  year integer NOT NULL,
  competition_modality text NOT NULL,
  round text NOT NULL,
  round_kind text NOT NULL CHECK (round_kind IN ('regular','waiting_snapshot')),
  score numeric(6,2) NOT NULL CHECK (score > 0 AND score <= 1000),
  maximum_score numeric(6,2) CHECK (maximum_score >= score AND maximum_score <= 1000),
  weights jsonb,
  minimum_scores jsonb,
  weights_source_url text,
  source_record_id bigint NOT NULL REFERENCES source_records(id),
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS admission_history_filters_idx ON admission_history (year, institution_id, competition_modality);
