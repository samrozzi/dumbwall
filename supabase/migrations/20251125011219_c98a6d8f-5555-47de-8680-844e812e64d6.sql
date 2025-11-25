-- Allow thread members to delete threads
CREATE POLICY "Thread members can delete threads"
ON chat_threads FOR DELETE
TO authenticated
USING (
  is_circle_member(circle_id, auth.uid()) AND
  (auth.uid() = created_by OR 
   id IN (
     SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
   ))
);