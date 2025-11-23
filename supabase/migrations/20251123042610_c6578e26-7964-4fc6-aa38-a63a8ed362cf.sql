-- Create thread_members table to track thread participants
CREATE TABLE public.thread_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.thread_members ENABLE ROW LEVEL SECURITY;

-- Users can view their thread memberships
CREATE POLICY "Users can view their thread memberships"
ON public.thread_members FOR SELECT
USING (user_id = auth.uid());

-- Thread creators can add members
CREATE POLICY "Thread creators can add members"
ON public.thread_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_threads
    WHERE id = thread_id
    AND created_by = auth.uid()
  )
);

-- Update chat_threads RLS to only show threads where user is a member
DROP POLICY IF EXISTS "Circle members can view threads" ON public.chat_threads;
CREATE POLICY "Users can view their threads"
ON public.chat_threads FOR SELECT
USING (
  id IN (
    SELECT thread_id FROM thread_members
    WHERE user_id = auth.uid()
  )
);

-- Update chat_messages RLS to only show messages in threads where user is a member
DROP POLICY IF EXISTS "Circle members can view messages" ON public.chat_messages;
CREATE POLICY "Users can view messages in their threads"
ON public.chat_messages FOR SELECT
USING (
  thread_id IN (
    SELECT thread_id FROM thread_members
    WHERE user_id = auth.uid()
  )
);

-- Users can only send messages to threads they're members of
DROP POLICY IF EXISTS "Circle members can create messages" ON public.chat_messages;
CREATE POLICY "Thread members can create messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  thread_id IN (
    SELECT thread_id FROM thread_members
    WHERE user_id = auth.uid()
  ) AND auth.uid() = sender_id
);

-- Enable realtime for thread_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_members;