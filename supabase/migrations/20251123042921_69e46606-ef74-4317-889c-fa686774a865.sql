-- Backfill thread_members with thread creators for all existing threads
INSERT INTO thread_members (thread_id, user_id, joined_at)
SELECT 
  id as thread_id,
  created_by as user_id,
  created_at as joined_at
FROM chat_threads
WHERE id NOT IN (SELECT DISTINCT thread_id FROM thread_members)
ON CONFLICT (thread_id, user_id) DO NOTHING;