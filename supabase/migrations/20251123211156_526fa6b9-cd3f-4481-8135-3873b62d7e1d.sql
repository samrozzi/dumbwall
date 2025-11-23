-- Add image support to chat messages
ALTER TABLE chat_messages 
ADD COLUMN image_url text,
ADD COLUMN image_caption text;

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true);

-- RLS: Circle members can upload chat images
CREATE POLICY "Circle members can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid() = owner
);

-- RLS: Circle members can view chat images
CREATE POLICY "Circle members can view chat images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-images'
);