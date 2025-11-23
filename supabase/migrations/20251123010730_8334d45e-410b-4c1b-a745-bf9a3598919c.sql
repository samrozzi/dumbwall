-- Fix INSERT policy on circle_members to allow users to add themselves as owner
DROP POLICY IF EXISTS "Circle owners can add members" ON public.circle_members;

CREATE POLICY "Circle owners can add members"
ON public.circle_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow users to add themselves as owner (when creating a new circle)
  (user_id = auth.uid() AND role = 'owner'::member_role)
  OR
  -- Allow existing circle owners to add new members
  (EXISTS (
    SELECT 1 
    FROM circle_members cm
    WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'owner'::member_role
  ))
);