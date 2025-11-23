-- Fix the get_user_id_by_email function to access auth.users table
-- The issue is that the search_path was set to 'public' only, but auth.users is in the 'auth' schema

DROP FUNCTION IF EXISTS public.get_user_id_by_email(text);

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'auth', 'public'
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;