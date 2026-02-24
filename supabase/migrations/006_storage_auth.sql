-- Restrict event image uploads and deletes to authenticated users only

DROP POLICY IF EXISTS "Anyone can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete event images" ON storage.objects;

-- Only authenticated users may upload images
CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images');

-- Only authenticated users may delete images
CREATE POLICY "Authenticated users can delete event images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images');
