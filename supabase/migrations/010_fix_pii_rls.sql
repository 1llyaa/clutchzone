-- ============================================================
-- SECURITY FIX: permissive anon RLS policies exposed PII.
--
-- bookings and tournament_registrations were world-readable
-- (SELECT USING (true)) and world-writable (INSERT WITH CHECK (true)),
-- reachable directly via the public NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- This leaked customer_name/email/phone/discord and captain/team/player
-- data to any anonymous caller of the PostgREST/Realtime API.
--
-- All legitimate access goes through server routes using the
-- service-role client (createAdminClient), which bypasses RLS. The one
-- exception is the admin live-notification realtime subscription
-- (src/components/admin/AdminNotifications.tsx), which runs in the
-- authenticated admin's browser and therefore matches an admin policy.
--
-- Run AFTER 004 (needs profiles) and 009.
-- ============================================================

-- Bookings: drop world read + write.
DROP POLICY IF EXISTS "bookings_read"   ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;

-- Admins (any row in profiles) may read. Required so the realtime
-- INSERT stream reaches AdminNotifications, which subscribes with the
-- authenticated admin session rather than the raw anon key.
CREATE POLICY "bookings_admin_read" ON bookings
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles));

-- Tournament registrations: drop world read + write. No client-side
-- access path exists; server routes use the service-role client.
DROP POLICY IF EXISTS "treg_read"   ON tournament_registrations;
DROP POLICY IF EXISTS "treg_insert" ON tournament_registrations;

-- Contact messages: drop world write. Submissions go through
-- POST /api/contact using the service-role client. (There was no read
-- policy, so the table stays default-deny for reads.)
DROP POLICY IF EXISTS "contact_insert" ON contact_messages;
