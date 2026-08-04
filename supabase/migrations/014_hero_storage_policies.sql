-- Storage policies for "hero" bucket
CREATE POLICY "hero_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'hero');
CREATE POLICY "hero_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hero' AND auth.role() = 'authenticated');
CREATE POLICY "hero_auth_delete" ON storage.objects FOR DELETE USING  (bucket_id = 'hero' AND auth.role() = 'authenticated');
