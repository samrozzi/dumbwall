-- Fix user search to allow finding users by display_name even if username is null
CREATE OR REPLACE FUNCTION public.search_users_by_username_or_email(search_term text)
RETURNS TABLE(id uuid, username text, display_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    id,
    username,
    display_name,
    avatar_url
  FROM profiles
  WHERE 
    (username ILIKE '%' || search_term || '%' OR 
     LOWER(display_name) ILIKE '%' || LOWER(search_term) || '%')
  LIMIT 10;
$function$;