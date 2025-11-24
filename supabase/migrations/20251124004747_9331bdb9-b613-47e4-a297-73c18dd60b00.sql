-- Add new wall item types for interactive features
ALTER TYPE wall_item_type ADD VALUE IF NOT EXISTS 'poll';
ALTER TYPE wall_item_type ADD VALUE IF NOT EXISTS 'audio';
ALTER TYPE wall_item_type ADD VALUE IF NOT EXISTS 'doodle';
ALTER TYPE wall_item_type ADD VALUE IF NOT EXISTS 'music';
ALTER TYPE wall_item_type ADD VALUE IF NOT EXISTS 'challenge';

-- Create storage bucket for audio clips
INSERT INTO storage.buckets (id, name, public)
VALUES ('wall-audio', 'wall-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for doodles
INSERT INTO storage.buckets (id, name, public)
VALUES ('wall-doodles', 'wall-doodles', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for music album art
INSERT INTO storage.buckets (id, name, public)
VALUES ('wall-music-art', 'wall-music-art', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for wall-audio bucket
CREATE POLICY "Circle members can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wall-audio' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'wall-audio');

CREATE POLICY "Audio owners can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wall-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for wall-doodles bucket
CREATE POLICY "Circle members can upload doodles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wall-doodles' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view doodles"
ON storage.objects FOR SELECT
USING (bucket_id = 'wall-doodles');

CREATE POLICY "Doodle owners can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wall-doodles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for wall-music-art bucket
CREATE POLICY "Circle members can upload music art"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wall-music-art' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view music art"
ON storage.objects FOR SELECT
USING (bucket_id = 'wall-music-art');

CREATE POLICY "Music art owners can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wall-music-art' AND
  auth.uid()::text = (storage.foldername(name))[1]
);