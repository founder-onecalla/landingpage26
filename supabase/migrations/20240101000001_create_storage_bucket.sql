-- Create private storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-intake',
  'voice-intake',
  false,
  52428800, -- 50MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: only service role can upload and read
CREATE POLICY "Service role upload voice-intake"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-intake'
    AND auth.role() = 'service_role'
  );

CREATE POLICY "Service role read voice-intake"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'voice-intake'
    AND auth.role() = 'service_role'
  );
