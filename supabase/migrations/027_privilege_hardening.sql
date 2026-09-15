-- ============================================================
-- SECURITY FIX: privilege was granted by existing, not by decision.
--
-- 004 attached a trigger to auth.users that gave every new authentication
-- user a profiles row with role 'staff'. Every "admin" policy since then has
-- tested membership in profiles rather than the role, and requireAdmin()
-- accepts both values of the enum. With self-signup enabled — the default on
-- hosted Supabase and in the self-hosted GoTrue image — a stranger could
-- register and read every customer's name, e-mail and phone number.
--
-- Three changes, each independently sufficient to close it, applied together:
--   1. No more automatic profile. An owner grants access through the invite
--      route, which now inserts the row itself (see the staff API route).
--   2. Every policy tests the role instead of mere existence.
--   3. Storage writes require staff, not merely a signed-in session.
--
-- Also revokes the nudge config function from the API-exposed roles: the
-- REVOKE FROM PUBLIC in 025 did not remove Supabase's explicit default
-- grants to anon and authenticated, so the function stayed callable by anyone
-- holding the public anon key.
--
-- Vault is now installed on both environments, so the app.cron_secret fallback
-- branch should no longer be reachable — but that is defence by accident: it
-- rests on how a name resolves for the anon role, not on an access rule, and it
-- stops protecting anything the moment the extension is removed or the setting
-- is re-added. The grant is what should have been stopping the call.
--
-- AFTER APPLYING: a user created straight from the Supabase dashboard will
-- have no profile and therefore no access. Bootstrap an owner by hand:
--   INSERT INTO public.profiles (id, email, role)
--   VALUES ('<auth.users.id>', '<email>', 'owner');
-- ============================================================

-- 1. Stop granting privilege automatically.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. One predicate, used everywhere, that tests the role.
--    SECURITY INVOKER: it only ever reports on the caller's own row, and
--    profiles_self_read (004) already lets a caller see that row.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('owner', 'staff')
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;

-- anon, authenticated and service_role are created by Supabase, not by
-- Postgres. The migration-check workflow applies these files to a plain
-- postgres:16 where they do not exist and a bare GRANT would abort the run, so
-- the role-scoped statements are deferred to run time the way 025 defers its
-- vault lookup. On every real deployment the roles are present and this runs.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_staff() TO anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated';
  END IF;
END
$$;

-- 3. Table policies: role, not existence.
DROP POLICY IF EXISTS "bookings_admin_read" ON bookings;
CREATE POLICY "bookings_admin_read" ON bookings
  FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "treg_admin_read" ON tournament_registrations;
CREATE POLICY "treg_admin_read" ON tournament_registrations
  FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "station_blocks_admin_read" ON station_blocks;
CREATE POLICY "station_blocks_admin_read" ON station_blocks
  FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "pc_prices_admin_update" ON pc_duration_prices;
CREATE POLICY "pc_prices_admin_update" ON pc_duration_prices
  FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "ps5_prices_admin_update" ON ps5_duration_prices;
CREATE POLICY "ps5_prices_admin_update" ON ps5_duration_prices
  FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 4. Storage writes: staff, not merely authenticated. Reads stay public —
--    these are the buckets the public homepage renders from.
DROP POLICY IF EXISTS "gallery_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "gallery_auth_delete" ON storage.objects;
CREATE POLICY "gallery_staff_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery' AND public.is_staff());
CREATE POLICY "gallery_staff_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery' AND public.is_staff());

DROP POLICY IF EXISTS "games_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "games_storage_delete" ON storage.objects;
CREATE POLICY "games_staff_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'games' AND public.is_staff());
CREATE POLICY "games_staff_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'games' AND public.is_staff());

DROP POLICY IF EXISTS "hero_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "hero_auth_delete" ON storage.objects;
CREATE POLICY "hero_staff_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hero' AND public.is_staff());
CREATE POLICY "hero_staff_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'hero' AND public.is_staff());

DROP POLICY IF EXISTS "private_events_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "private_events_auth_delete" ON storage.objects;
CREATE POLICY "private_events_staff_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'private_events' AND public.is_staff());
CREATE POLICY "private_events_staff_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'private_events' AND public.is_staff());

DROP POLICY IF EXISTS "sponsors_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "sponsors_auth_delete" ON storage.objects;
CREATE POLICY "sponsors_staff_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sponsors' AND public.is_staff());
CREATE POLICY "sponsors_staff_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'sponsors' AND public.is_staff());

-- 5. The cron config function must not be callable over the API.
--    pg_cron runs the job as the role that scheduled it, which is none of
--    these, so removing them costs the job nothing.
DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.payment_nudge_config() FROM %I', r
      );
    END IF;
  END LOOP;
END
$$;
