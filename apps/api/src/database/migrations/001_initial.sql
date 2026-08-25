CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sources (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  publisher text NOT NULL,
  canonical_url text NOT NULL,
  license text,
  UNIQUE (name, publisher)
);

CREATE TABLE IF NOT EXISTS source_snapshots (
  id bigserial PRIMARY KEY,
  source_id bigint NOT NULL REFERENCES sources(id),
  reference_period text NOT NULL,
  published_at timestamptz,
  retrieved_at timestamptz NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  sha256 text NOT NULL,
  original_url text NOT NULL,
  schema_version text NOT NULL,
  UNIQUE (source_id, sha256)
);

CREATE TABLE IF NOT EXISTS source_records (
  id bigserial PRIMARY KEY,
  snapshot_id bigint NOT NULL REFERENCES source_snapshots(id),
  dataset text NOT NULL,
  natural_key text NOT NULL,
  raw_payload jsonb NOT NULL,
  row_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_id, dataset, natural_key)
);

CREATE TABLE IF NOT EXISTS states (
  id bigserial PRIMARY KEY,
  ibge_code text NOT NULL UNIQUE,
  name text NOT NULL,
  abbreviation char(2) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS municipalities (
  id bigserial PRIMARY KEY,
  ibge_code text NOT NULL UNIQUE,
  state_id bigint NOT NULL REFERENCES states(id),
  name text NOT NULL,
  slug text NOT NULL,
  reference_latitude double precision CHECK (reference_latitude BETWEEN -90 AND 90),
  reference_longitude double precision CHECK (reference_longitude BETWEEN -180 AND 180),
  location_note text,
  UNIQUE (state_id, slug)
);

CREATE TABLE IF NOT EXISTS maintainers (
  id bigserial PRIMARY KEY,
  inep_code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS institutions (
  id bigserial PRIMARY KEY,
  inep_code text NOT NULL UNIQUE,
  maintainer_id bigint REFERENCES maintainers(id),
  headquarters_municipality_id bigint REFERENCES municipalities(id),
  name text NOT NULL,
  acronym text,
  slug text NOT NULL UNIQUE,
  academic_organization text,
  administrative_category text,
  education_network text CHECK (education_network IN ('publica', 'privada') OR education_network IS NULL),
  headquarters_address jsonb,
  raw_payload jsonb,
  source_record_id bigint REFERENCES source_records(id),
  snapshot_id bigint REFERENCES source_snapshots(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campuses (
  id bigserial PRIMARY KEY,
  institution_id bigint NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  municipality_id bigint REFERENCES municipalities(id),
  external_code text,
  name text NOT NULL,
  slug text NOT NULL,
  address jsonb,
  latitude double precision CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude BETWEEN -180 AND 180),
  location_status text NOT NULL DEFAULT 'nao_confirmado' CHECK (location_status IN ('confirmado','importado','nao_confirmado')),
  status text NOT NULL DEFAULT 'nao_confirmado' CHECK (status IN ('confirmado','importado','nao_confirmado')),
  source_record_id bigint REFERENCES source_records(id),
  updated_at timestamptz,
  UNIQUE (institution_id, slug)
);

CREATE TABLE IF NOT EXISTS poles (
  id bigserial PRIMARY KEY,
  institution_id bigint NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  campus_id bigint REFERENCES campuses(id),
  municipality_id bigint REFERENCES municipalities(id),
  external_code text,
  name text NOT NULL,
  address jsonb,
  latitude double precision CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude BETWEEN -180 AND 180),
  status text NOT NULL DEFAULT 'nao_confirmado' CHECK (status IN ('confirmado','importado','nao_confirmado')),
  source_record_id bigint REFERENCES source_records(id)
);

CREATE TABLE IF NOT EXISTS courses (
  id bigserial PRIMARY KEY,
  cine_code text NOT NULL UNIQUE,
  canonical_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  cine_general_area_code text,
  cine_general_area_name text,
  cine_specific_area_code text,
  cine_specific_area_name text,
  cine_detailed_area_code text,
  cine_detailed_area_name text
);

CREATE TABLE IF NOT EXISTS course_catalog_records (
  id bigserial PRIMARY KEY,
  institution_id bigint NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  course_id bigint NOT NULL REFERENCES courses(id),
  municipality_id bigint REFERENCES municipalities(id),
  inep_course_code text NOT NULL,
  original_name text NOT NULL,
  dimension text NOT NULL,
  degree text,
  modality text NOT NULL CHECK (modality IN ('presencial','ead')),
  academic_level text,
  free_indicator boolean,
  census_year integer NOT NULL,
  census_seats numeric,
  enrolled numeric,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_record_id bigint REFERENCES source_records(id),
  snapshot_id bigint NOT NULL REFERENCES source_snapshots(id),
  UNIQUE NULLS NOT DISTINCT (snapshot_id, institution_id, inep_course_code, dimension, municipality_id, degree, modality, academic_level)
);

CREATE TABLE IF NOT EXISTS course_statistics (
  id bigserial PRIMARY KEY,
  catalog_record_id bigint NOT NULL REFERENCES course_catalog_records(id) ON DELETE CASCADE,
  metric text NOT NULL,
  value numeric NOT NULL,
  year integer NOT NULL,
  source_record_id bigint REFERENCES source_records(id),
  UNIQUE (catalog_record_id, metric, year)
);

CREATE TABLE IF NOT EXISTS course_offerings (
  id bigserial PRIMARY KEY,
  institution_id bigint NOT NULL REFERENCES institutions(id),
  course_id bigint NOT NULL REFERENCES courses(id),
  campus_id bigint REFERENCES campuses(id),
  pole_id bigint REFERENCES poles(id),
  external_code text,
  degree text NOT NULL,
  modality text NOT NULL CHECK (modality IN ('presencial','ead')),
  shift text CHECK (shift IN ('matutino','vespertino','noturno','integral','ead','nao_confirmado')),
  regulatory_status text NOT NULL DEFAULT 'nao_confirmado' CHECK (regulatory_status IN ('ativo','inativo','nao_confirmado')),
  data_status text NOT NULL DEFAULT 'nao_confirmado' CHECK (data_status IN ('confirmado','importado','nao_confirmado')),
  source_record_id bigint REFERENCES source_records(id),
  updated_at timestamptz,
  CHECK (campus_id IS NOT NULL OR pole_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS field_observations (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id bigint NOT NULL,
  field_name text NOT NULL,
  value_json jsonb,
  status text NOT NULL CHECK (status IN ('confirmado','importado','nao_confirmado')),
  reason text,
  source_record_id bigint REFERENCES source_records(id),
  observed_at timestamptz,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  CHECK (status = 'nao_confirmado' OR source_record_id IS NOT NULL),
  CHECK (status <> 'nao_confirmado' OR reason IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS verifications (
  id bigserial PRIMARY KEY,
  observation_id bigint NOT NULL REFERENCES field_observations(id),
  method text NOT NULL,
  status text NOT NULL CHECK (status IN ('aceita','rejeitada','pendente')),
  evidence_url text,
  verified_at timestamptz,
  notes text
);

CREATE TABLE IF NOT EXISTS tuitions (
  id bigserial PRIMARY KEY,
  offering_id bigint NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  year integer NOT NULL,
  semester smallint NOT NULL CHECK (semester IN (1,2)),
  regular_amount numeric(12,2),
  promotional_amount numeric(12,2),
  currency char(3) NOT NULL DEFAULT 'BRL',
  status text NOT NULL CHECK (status IN ('confirmado','importado','nao_confirmado')),
  source_record_id bigint REFERENCES source_records(id),
  updated_at timestamptz,
  CHECK (promotional_amount IS NULL OR regular_amount IS NOT NULL),
  UNIQUE (offering_id, year, semester)
);

CREATE TABLE IF NOT EXISTS admission_offers (
  id bigserial PRIMARY KEY,
  offering_id bigint NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  program text NOT NULL,
  edition text NOT NULL,
  year integer NOT NULL,
  semester smallint CHECK (semester IN (1,2)),
  seats integer,
  source_record_id bigint REFERENCES source_records(id),
  UNIQUE (offering_id, program, edition)
);

CREATE TABLE IF NOT EXISTS cutoff_scores (
  id bigserial PRIMARY KEY,
  admission_offer_id bigint NOT NULL REFERENCES admission_offers(id) ON DELETE CASCADE,
  competition_modality text NOT NULL,
  score numeric(6,2) NOT NULL CHECK (score BETWEEN 0 AND 1000),
  round text NOT NULL,
  source_record_id bigint REFERENCES source_records(id),
  updated_at timestamptz NOT NULL,
  UNIQUE (admission_offer_id, competition_modality, round)
);

CREATE TABLE IF NOT EXISTS contacts (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corrections (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id bigint,
  description text NOT NULL,
  evidence_url text,
  name text,
  email text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','reviewer','admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_items (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_record_id bigint NOT NULL REFERENCES course_catalog_records(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_record_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  actor_user_id bigint REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id bigint,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS import_runs (
  id bigserial PRIMARY KEY,
  snapshot_id bigint NOT NULL REFERENCES source_snapshots(id),
  importer_version text NOT NULL,
  status text NOT NULL,
  rows_read bigint NOT NULL DEFAULT 0,
  rows_imported bigint NOT NULL DEFAULT 0,
  rows_rejected bigint NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (snapshot_id, importer_version)
);

CREATE TABLE IF NOT EXISTS import_rejections (
  id bigserial PRIMARY KEY,
  import_run_id bigint NOT NULL REFERENCES import_runs(id),
  dataset text NOT NULL,
  row_number bigint,
  code text NOT NULL,
  message text NOT NULL,
  raw_payload jsonb
);

CREATE INDEX IF NOT EXISTS institutions_name_trgm_idx ON institutions USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS courses_name_trgm_idx ON courses USING gin (canonical_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS municipalities_name_trgm_idx ON municipalities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS campuses_location_idx ON campuses (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_search_idx ON course_catalog_records (municipality_id, modality, degree, census_year);
CREATE INDEX IF NOT EXISTS observations_entity_idx ON field_observations (entity_type, entity_id, field_name, valid_to);
