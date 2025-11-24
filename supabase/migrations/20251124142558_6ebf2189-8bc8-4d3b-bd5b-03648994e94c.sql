-- Create enums for user status and social platforms
CREATE TYPE user_status AS ENUM ('available', 'busy', 'away', 'offline');
CREATE TYPE social_platform AS ENUM ('instagram', 'tiktok', 'x', 'discord', 'steam', 'spotify', 'twitch', 'youtube', 'website', 'other');

-- Extend profiles table with social profile fields
ALTER TABLE public.profiles
  ADD COLUMN bio TEXT,
  ADD COLUMN tagline TEXT,
  ADD COLUMN location TEXT,
  ADD COLUMN pronouns TEXT,
  ADD COLUMN cover_url TEXT,
  ADD COLUMN status user_status DEFAULT 'available',
  ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN bio_public BOOLEAN DEFAULT true,
  ADD COLUMN tagline_public BOOLEAN DEFAULT true,
  ADD COLUMN location_public BOOLEAN DEFAULT true,
  ADD COLUMN pronouns_public BOOLEAN DEFAULT true,
  ADD COLUMN interests_public BOOLEAN DEFAULT true,
  ADD COLUMN social_links_public BOOLEAN DEFAULT true;

-- Create profile_interests table
CREATE TABLE public.profile_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;

-- Create social_links table
CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  handle_or_url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Create profile_views table
CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_interests
CREATE POLICY "Users can view public interests"
  ON public.profile_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_interests.user_id
      AND p.interests_public = true
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can manage their own interests"
  ON public.profile_interests FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for social_links
CREATE POLICY "Users can view public social links"
  ON public.social_links FOR SELECT
  USING (
    is_public = true
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can manage their own social links"
  ON public.social_links FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for profile_views
CREATE POLICY "Users can view their own profile views"
  ON public.profile_views FOR SELECT
  USING (profile_user_id = auth.uid() OR viewer_user_id = auth.uid());

CREATE POLICY "Authenticated users can log profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_user_id);

-- Create storage bucket for cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true);

-- Storage policies for covers bucket
CREATE POLICY "Cover images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own cover"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own cover"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );