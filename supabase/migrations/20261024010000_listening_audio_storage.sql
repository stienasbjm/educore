-- Public listening audio for student playback; only registered admins can manage files.
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS listening_audio_enabled boolean NOT NULL DEFAULT true;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listening-audio',
  'listening-audio',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS listening_audio_admin_manage ON storage.objects;
CREATE POLICY listening_audio_admin_manage ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'listening-audio' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'listening-audio' AND public.is_admin_user());
