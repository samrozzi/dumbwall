-- Fix the circles UPDATE policy that has incorrect table reference
DROP POLICY IF EXISTS "Circle owners can update their circles" ON public.circles;

CREATE POLICY "Circle owners can update their circles"
ON public.circles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM circle_members
    WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = auth.uid()
      AND circle_members.role = 'owner'::member_role
  )
);