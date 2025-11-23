-- Fix the circular dependency in chat_threads SELECT policy
-- Allow users to view threads they created OR threads they're members of
DROP POLICY IF EXISTS "Users can view their threads" ON public.chat_threads;

CREATE POLICY "Users can view their threads"
ON public.chat_threads FOR SELECT
USING (
  auth.uid() = created_by 
  OR 
  id IN (
    SELECT thread_id 
    FROM thread_members 
    WHERE user_id = auth.uid()
  )
);