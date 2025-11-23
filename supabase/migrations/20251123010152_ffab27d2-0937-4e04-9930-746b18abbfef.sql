-- Drop and recreate INSERT policy with explicit role
DROP POLICY IF EXISTS "Users can create circles" ON public.circles;

CREATE POLICY "Users can create circles"
ON public.circles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);