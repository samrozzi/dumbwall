-- Fix 1: Allow invited users to update their own invite status
DROP POLICY IF EXISTS "Circle owners can update invites" ON circle_invites;

CREATE POLICY "Circle owners and invited users can update invites"
ON circle_invites
FOR UPDATE
USING (
  -- Circle owners can update any invite
  EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_members.circle_id = circle_invites.circle_id
    AND circle_members.user_id = auth.uid()
    AND circle_members.role = 'owner'::member_role
  )
  OR
  -- Invited users can update their own invite
  (invited_email = get_current_user_email())
);

-- Fix 2: Allow all circle members to see wall threads
DROP POLICY IF EXISTS "Users can view their threads" ON chat_threads;

CREATE POLICY "Users can view their threads and circle wall threads"
ON chat_threads
FOR SELECT
USING (
  -- User created the thread
  (auth.uid() = created_by)
  OR
  -- User is in thread_members
  (id IN (
    SELECT thread_id FROM thread_members
    WHERE user_id = auth.uid()
  ))
  OR
  -- Wall thread in user's circle
  (linked_wall_item_id IS NOT NULL AND is_circle_member(circle_id, auth.uid()))
);