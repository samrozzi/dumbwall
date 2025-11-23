-- Grant execute permission on the get_user_email_by_id function
GRANT EXECUTE ON FUNCTION public.get_user_email_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email_by_id(uuid) TO service_role;