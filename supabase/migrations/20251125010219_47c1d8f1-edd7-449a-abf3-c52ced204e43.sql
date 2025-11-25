-- Create deleted_messages table for "delete for me" functionality
CREATE TABLE deleted_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE deleted_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own deletions
CREATE POLICY "Users can insert their own deletions"
ON deleted_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own deletions
CREATE POLICY "Users can view their own deletions"
ON deleted_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow message owners to delete their messages
CREATE POLICY "Message owners can delete messages"
ON chat_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);