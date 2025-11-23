-- Create function to get user email by user ID
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'auth', 'public'
AS $function$
  SELECT email FROM auth.users WHERE id = user_uuid LIMIT 1;
$function$;