-- Drop existing INSERT policy on chat_messages
DROP POLICY IF EXISTS "Thread members can create messages" ON chat_messages;

-- Create new policy allowing thread members AND circle members for wall threads
CREATE POLICY "Thread members and circle members can create messages"
ON chat_messages
FOR INSERT
WITH CHECK (
  -- User must be the sender
  (auth.uid() = sender_id)
  AND
  (
    -- Either: User is in thread_members
    (thread_id IN (
      SELECT thread_id FROM thread_members
      WHERE user_id = auth.uid()
    ))
    OR
    -- Or: It's a wall thread and user is a circle member
    (thread_id IN (
      SELECT ct.id FROM chat_threads ct
      WHERE ct.linked_wall_item_id IS NOT NULL
      AND is_circle_member(ct.circle_id, auth.uid())
    ))
  )
);