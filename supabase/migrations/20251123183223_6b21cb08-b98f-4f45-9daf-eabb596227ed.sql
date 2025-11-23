-- Fix: Allow all circle members to see messages in wall threads
DROP POLICY IF EXISTS "Users can view messages in their threads" ON chat_messages;

CREATE POLICY "Users can view messages in their threads and wall threads"
ON chat_messages
FOR SELECT
USING (
  -- User is in thread_members
  (thread_id IN (
    SELECT thread_id FROM thread_members
    WHERE user_id = auth.uid()
  ))
  OR
  -- Message is in a wall thread and user is a circle member
  (thread_id IN (
    SELECT id FROM chat_threads
    WHERE linked_wall_item_id IS NOT NULL
    AND is_circle_member(circle_id, auth.uid())
  ))
);