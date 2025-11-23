-- Fix RLS policies on circle_invites to avoid accessing auth.users table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Circle members can view invites" ON public.circle_invites;
DROP POLICY IF EXISTS "Users can update their invites" ON public.circle_invites;

-- Create new simplified SELECT policy
-- Circle members can view all invites for their circles
CREATE POLICY "Circle members can view invites"
ON public.circle_invites
FOR SELECT
USING (is_circle_member(circle_id, auth.uid()));

-- Create new UPDATE policy
-- Only circle owners can update invites (approve/reject)
CREATE POLICY "Circle owners can update invites"
ON public.circle_invites
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = circle_invites.circle_id
    AND user_id = auth.uid()
    AND role = 'owner'::member_role
  )
);