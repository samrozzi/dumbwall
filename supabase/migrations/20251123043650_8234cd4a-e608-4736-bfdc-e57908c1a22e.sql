-- Create function to check if user created a thread (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_thread_creator(_thread_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_threads
    WHERE id = _thread_id
    AND created_by = _user_id
  );
$$;

-- Update the thread_members INSERT policy to use the function
DROP POLICY IF EXISTS "Thread creators can add members" ON public.thread_members;
CREATE POLICY "Thread creators can add members"
ON public.thread_members FOR INSERT
WITH CHECK (is_thread_creator(thread_id, auth.uid()));