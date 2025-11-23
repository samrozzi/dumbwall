-- Create function to search users by username or email globally
CREATE OR REPLACE FUNCTION public.search_users_by_username_or_email(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    username,
    display_name,
    avatar_url
  FROM profiles
  WHERE 
    (username ILIKE '%' || search_term || '%' OR 
     LOWER(display_name) ILIKE '%' || LOWER(search_term) || '%')
    AND username IS NOT NULL
  LIMIT 10;
$$;