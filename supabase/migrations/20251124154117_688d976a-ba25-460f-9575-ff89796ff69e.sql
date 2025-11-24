-- Add presence and activity tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_presence boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS status_mode text DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- Create circle_profiles table for circle-specific overrides
CREATE TABLE IF NOT EXISTS circle_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  nickname text,
  avatar_override_url text,
  tagline_override text,
  visibility jsonb DEFAULT '{"show_socials": true, "show_location": true, "show_interests": true}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, circle_id)
);

-- Enable RLS on circle_profiles
ALTER TABLE circle_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view circle profiles for circles they're in
CREATE POLICY "Users can view circle profiles in their circles"
ON circle_profiles FOR SELECT
USING (
  is_circle_member(circle_id, auth.uid())
);

-- Users can manage their own circle profiles
CREATE POLICY "Users can manage their own circle profiles"
ON circle_profiles FOR ALL
USING (auth.uid() = user_id);

-- Trigger to update updated_at on circle_profiles
CREATE TRIGGER update_circle_profiles_updated_at
BEFORE UPDATE ON circle_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_circle_profiles_user_circle ON circle_profiles(user_id, circle_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);