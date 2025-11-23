-- Drop the existing INSERT policy for circle_members
DROP POLICY IF EXISTS "Circle owners can add members" ON circle_members;

-- Create new INSERT policy that allows:
-- 1. Users creating themselves as owner
-- 2. Existing owners adding members
-- 3. Users accepting valid invites
CREATE POLICY "Circle owners can add members and users can accept invites" 
ON circle_members 
FOR INSERT 
WITH CHECK (
  -- User creating themselves as owner
  ((user_id = auth.uid()) AND (role = 'owner'::member_role))
  OR
  -- Existing owner adding someone
  (EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = circle_members.circle_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'owner'::member_role
  ))
  OR
  -- User accepting a valid pending invite
  ((user_id = auth.uid()) AND EXISTS (
    SELECT 1 FROM circle_invites
    WHERE circle_invites.circle_id = circle_members.circle_id
    AND circle_invites.invited_email = get_current_user_email()
    AND circle_invites.status = 'pending'
  ))
);