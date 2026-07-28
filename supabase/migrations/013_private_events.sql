-- Private events section image (teambuilding / birthday parties)
INSERT INTO site_settings (key, value)
VALUES ('private_events_image', '/terrorist_cs2.png')
ON CONFLICT (key) DO NOTHING;

-- Storage policies (bucket 'private_events' created manually in Supabase dashboard)
CREATE POLICY "private_events_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'private_events');
CREATE POLICY "private_events_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'private_events' AND auth.role() = 'authenticated');
CREATE POLICY "private_events_auth_delete" ON storage.objects FOR DELETE USING  (bucket_id = 'private_events' AND auth.role() = 'authenticated');
