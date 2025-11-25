-- Fix storage bucket RLS policies for chat-images and voice-messages

-- Create voice-messages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view voice messages" ON storage.objects;

-- Chat images upload policy
CREATE POLICY "Users can upload their own chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Chat images view policy
CREATE POLICY "Anyone can view chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');

-- Voice messages upload policy
CREATE POLICY "Users can upload their own voice messages"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Voice messages view policy
CREATE POLICY "Anyone can view voice messages"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'voice-messages');

-- Delete policies for users to delete their own files
CREATE POLICY "Users can delete their own chat images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);