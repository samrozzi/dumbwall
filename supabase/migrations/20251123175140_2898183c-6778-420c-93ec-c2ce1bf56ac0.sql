-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email text;

-- Create index for email lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Update existing profiles with their email from auth.users
UPDATE public.profiles
SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id);

-- Update handle_new_user trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'username',
    new.email
  );
  RETURN new;
END;
$function$;

-- Create security definer function to get current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'auth', 'public'
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Update RLS policy on circle_invites to use the security definer function
DROP POLICY IF EXISTS "Circle members and invited users can view invites" ON circle_invites;

CREATE POLICY "Circle members and invited users can view invites"
ON circle_invites FOR SELECT
USING (
  is_circle_member(circle_id, auth.uid()) 
  OR 
  invited_email = get_current_user_email()
);