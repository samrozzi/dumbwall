-- Create message_read_receipts table for read receipt tracking
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_read_receipts
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Users can insert their own read receipts for messages they can view
CREATE POLICY "Users can mark messages as read in their threads"
  ON public.message_read_receipts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_messages cm
      WHERE cm.id = message_read_receipts.message_id
      AND (
        cm.thread_id IN (
          SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
        )
        OR cm.thread_id IN (
          SELECT ct.id FROM chat_threads ct
          WHERE ct.linked_wall_item_id IS NOT NULL
          AND is_circle_member(ct.circle_id, auth.uid())
        )
      )
    )
  );

-- Users can update their own read receipts
CREATE POLICY "Users can update their own read receipts"
  ON public.message_read_receipts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view read receipts for messages in their threads
CREATE POLICY "Users can view read receipts in their threads"
  ON public.message_read_receipts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      WHERE cm.id = message_read_receipts.message_id
      AND (
        cm.thread_id IN (
          SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
        )
        OR cm.thread_id IN (
          SELECT ct.id FROM chat_threads ct
          WHERE ct.linked_wall_item_id IS NOT NULL
          AND is_circle_member(ct.circle_id, auth.uid())
        )
      )
    )
  );

-- Create typing_indicators table for typing indicator tracking
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(thread_id, user_id)
);

-- Enable RLS on typing_indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can insert their own typing indicators
CREATE POLICY "Users can insert their own typing indicators"
  ON public.typing_indicators
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      thread_id IN (
        SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
      )
      OR thread_id IN (
        SELECT ct.id FROM chat_threads ct
        WHERE ct.linked_wall_item_id IS NOT NULL
        AND is_circle_member(ct.circle_id, auth.uid())
      )
    )
  );

-- Users can update their own typing indicators
CREATE POLICY "Users can update their own typing indicators"
  ON public.typing_indicators
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own typing indicators
CREATE POLICY "Users can delete their own typing indicators"
  ON public.typing_indicators
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view typing indicators in their threads
CREATE POLICY "Users can view typing indicators in their threads"
  ON public.typing_indicators
  FOR SELECT
  USING (
    thread_id IN (
      SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
    )
    OR thread_id IN (
      SELECT ct.id FROM chat_threads ct
      WHERE ct.linked_wall_item_id IS NOT NULL
      AND is_circle_member(ct.circle_id, auth.uid())
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON public.message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_thread_id ON public.typing_indicators(thread_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires_at ON public.typing_indicators(expires_at);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;