-- Supabase exposes the public schema through its Data API. The Faculdade Perto
-- API connects directly to Postgres, so browser clients must not access these
-- tables with the Supabase anon/authenticated roles.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'sources','source_snapshots','source_records','states','municipalities',
    'maintainers','institutions','campuses','poles','courses',
    'course_catalog_records','course_statistics','course_offerings',
    'field_observations','verifications','tuitions','admission_offers',
    'cutoff_scores','contacts','corrections','users','user_sessions',
    'plan_items','audit_logs','import_runs','import_rejections'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
  END IF;
END $$;
