-- Create public storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read event images
CREATE POLICY "Event images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

-- Allow anyone to upload event images
CREATE POLICY "Anyone can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-images');

-- Allow anyone to delete their own event images (for remove button)
CREATE POLICY "Anyone can delete event images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-images');
