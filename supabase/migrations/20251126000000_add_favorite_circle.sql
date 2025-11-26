-- Add favorite_circle_id to profiles table
ALTER TABLE profiles
ADD COLUMN favorite_circle_id uuid REFERENCES circles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_profiles_favorite_circle ON profiles(favorite_circle_id);

-- Add comment
COMMENT ON COLUMN profiles.favorite_circle_id IS 'The user''s favorite circle for auto-redirect on login';
