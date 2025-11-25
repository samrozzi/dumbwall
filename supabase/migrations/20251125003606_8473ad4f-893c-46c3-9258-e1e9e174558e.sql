-- Add missing columns to chat_messages table for GIF and voice messages
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS gif_url TEXT,
  ADD COLUMN IF NOT EXISTS gif_title TEXT,
  ADD COLUMN IF NOT EXISTS voice_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

-- Add constraint to validate message types (drop first if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_message_type'
  ) THEN
    ALTER TABLE public.chat_messages 
      ADD CONSTRAINT valid_message_type 
      CHECK (message_type IN ('text', 'image', 'gif', 'voice'));
  END IF;
END $$;

-- Modify the message_length_limit constraint to allow empty body for media messages
ALTER TABLE public.chat_messages 
  DROP CONSTRAINT IF EXISTS message_length_limit;

ALTER TABLE public.chat_messages 
  ADD CONSTRAINT message_length_limit 
  CHECK (
    (message_type = 'text' AND length(body) > 0 AND length(body) <= 5000) OR
    (message_type IN ('image', 'gif', 'voice'))
  );

-- Create voice-messages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies before creating new ones for voice-messages
DROP POLICY IF EXISTS "Authenticated users can upload voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice messages" ON storage.objects;

-- RLS policies for voice-messages bucket
CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view voice messages"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fix chat-images bucket RLS policies
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');