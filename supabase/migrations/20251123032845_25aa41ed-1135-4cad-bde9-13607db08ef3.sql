-- Create enum for invite permissions
CREATE TYPE public.invite_permission AS ENUM ('anyone', 'owner_only');

-- Create enum for invite status
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- Create enum for invite type
CREATE TYPE public.invite_type AS ENUM ('direct', 'pending_approval');

-- Create circle_settings table
CREATE TABLE public.circle_settings (
  circle_id uuid PRIMARY KEY REFERENCES public.circles(id) ON DELETE CASCADE,
  invite_permission public.invite_permission NOT NULL DEFAULT 'owner_only',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on circle_settings
ALTER TABLE public.circle_settings ENABLE ROW LEVEL SECURITY;

-- Circle members can view settings
CREATE POLICY "Circle members can view settings"
ON public.circle_settings
FOR SELECT
USING (is_circle_member(circle_id, auth.uid()));

-- Circle owners can update settings
CREATE POLICY "Circle owners can update settings"
ON public.circle_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = circle_settings.circle_id
    AND user_id = auth.uid()
    AND role = 'owner'::member_role
  )
);

-- Circle owners can insert settings
CREATE POLICY "Circle owners can insert settings"
ON public.circle_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = circle_settings.circle_id
    AND user_id = auth.uid()
    AND role = 'owner'::member_role
  )
);

-- Create circle_invites table
CREATE TABLE public.circle_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES public.profiles(id),
  status public.invite_status NOT NULL DEFAULT 'pending',
  invite_type public.invite_type NOT NULL DEFAULT 'direct',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(circle_id, invited_email, status)
);

-- Enable RLS on circle_invites
ALTER TABLE public.circle_invites ENABLE ROW LEVEL SECURITY;

-- Circle members can view invites for their circles
CREATE POLICY "Circle members can view invites"
ON public.circle_invites
FOR SELECT
USING (
  is_circle_member(circle_id, auth.uid())
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Members can create invites based on permissions
CREATE POLICY "Members can create invites"
ON public.circle_invites
FOR INSERT
WITH CHECK (
  is_circle_member(circle_id, auth.uid())
  AND auth.uid() = invited_by
);

-- Users can update their own invites
CREATE POLICY "Users can update their invites"
ON public.circle_invites
FOR UPDATE
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = circle_invites.circle_id
    AND user_id = auth.uid()
    AND role = 'owner'::member_role
  )
);

-- Circle owners can delete invites
CREATE POLICY "Circle owners can delete invites"
ON public.circle_invites
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = circle_invites.circle_id
    AND user_id = auth.uid()
    AND role = 'owner'::member_role
  )
);

-- Add trigger for updated_at on circle_settings
CREATE TRIGGER update_circle_settings_updated_at
BEFORE UPDATE ON public.circle_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add trigger for updated_at on circle_invites
CREATE TRIGGER update_circle_invites_updated_at
BEFORE UPDATE ON public.circle_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Helper function to get user ID by email
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;

-- Helper function to check if user can invite to circle
CREATE OR REPLACE FUNCTION public.can_invite_to_circle(circle_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members cm
    LEFT JOIN circle_settings cs ON cs.circle_id = cm.circle_id
    WHERE cm.circle_id = circle_uuid
    AND cm.user_id = user_uuid
    AND (cm.role = 'owner'::member_role OR COALESCE(cs.invite_permission, 'owner_only'::invite_permission) = 'anyone'::invite_permission)
  );
$$;