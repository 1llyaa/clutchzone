-- Admin live notifications for new tournament registrations, mirroring
-- bookings_admin_read from 010 (needed so the realtime INSERT stream
-- reaches an authenticated admin's browser subscription).
CREATE POLICY "treg_admin_read" ON tournament_registrations
  FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles));

ALTER PUBLICATION supabase_realtime ADD TABLE tournament_registrations;
