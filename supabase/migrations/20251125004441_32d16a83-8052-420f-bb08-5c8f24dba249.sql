-- Fix storage RLS policies to match the new file path structure (threadId/userId/file)
-- Drop all existing policies first
DROP POLICY IF EXISTS "Authenticated users can upload voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Public can view voice messages" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images to their threads" ON storage.objects;

-- Voice messages bucket policies (threadId/userId/file.webm structure)
-- Using [2] because foldername array is 1-indexed: [1]=threadId, [2]=userId
CREATE POLICY "Users can upload voice messages to their threads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-messages' AND
  (storage.foldername(name))[2]::text = auth.uid()::text
);

CREATE POLICY "Public can view voice messages"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-messages' AND
  (storage.foldername(name))[2]::text = auth.uid()::text
);

-- Chat images bucket policies (threadId/userId/file.jpg structure)
CREATE POLICY "Users can upload images to their threads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[2]::text = auth.uid()::text
);

CREATE POLICY "Public can view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[2]::text = auth.uid()::text
);