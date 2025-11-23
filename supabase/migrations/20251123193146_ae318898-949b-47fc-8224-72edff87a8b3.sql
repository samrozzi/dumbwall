-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable realtime for message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Add reply_to_id column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL;

CREATE INDEX idx_chat_messages_reply_to_id ON public.chat_messages(reply_to_id);

-- RLS Policies for message_reactions

-- Users can view reactions in threads they're members of or wall threads in their circles
CREATE POLICY "Users can view reactions in their threads"
ON public.message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    WHERE cm.id = message_reactions.message_id
    AND (
      cm.thread_id IN (
        SELECT thread_id FROM public.thread_members WHERE user_id = auth.uid()
      )
      OR cm.thread_id IN (
        SELECT ct.id FROM public.chat_threads ct
        WHERE ct.linked_wall_item_id IS NOT NULL 
        AND is_circle_member(ct.circle_id, auth.uid())
      )
    )
  )
);

-- Users can add reactions to messages in their threads
CREATE POLICY "Users can add reactions in their threads"
ON public.message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.chat_messages cm
    WHERE cm.id = message_reactions.message_id
    AND (
      cm.thread_id IN (
        SELECT thread_id FROM public.thread_members WHERE user_id = auth.uid()
      )
      OR cm.thread_id IN (
        SELECT ct.id FROM public.chat_threads ct
        WHERE ct.linked_wall_item_id IS NOT NULL 
        AND is_circle_member(ct.circle_id, auth.uid())
      )
    )
  )
);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions FOR DELETE
USING (user_id = auth.uid());