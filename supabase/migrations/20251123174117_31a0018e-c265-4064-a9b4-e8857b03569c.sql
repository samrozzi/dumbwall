-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Circle members can view invites" ON circle_invites;

-- Create new policy that allows both circle members AND invited users to see invites
CREATE POLICY "Circle members and invited users can view invites"
ON circle_invites FOR SELECT
USING (
  is_circle_member(circle_id, auth.uid()) 
  OR 
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);