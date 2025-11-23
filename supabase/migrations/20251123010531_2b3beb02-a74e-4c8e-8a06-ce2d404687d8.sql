-- Fix SELECT policy to allow creators to see their circles immediately after creation
DROP POLICY IF EXISTS "Users can view circles they are members of" ON public.circles;

CREATE POLICY "Users can view circles they are members of"
ON public.circles
FOR SELECT
USING (
  is_circle_member(id, auth.uid()) 
  OR 
  created_by = auth.uid()
);