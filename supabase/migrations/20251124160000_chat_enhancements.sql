-- Chat Enhancements Migration
-- Adds support for typing indicators, message status, edits, pins, voice messages, GIFs, and link previews

-- 1. TYPING INDICATORS
CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 seconds'),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX idx_typing_indicators_thread ON typing_indicators(thread_id);
CREATE INDEX idx_typing_indicators_expires ON typing_indicators(expires_at);

-- Enable RLS
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can view typing indicators in their threads
CREATE POLICY "Users can view typing in their threads"
ON typing_indicators FOR SELECT
USING (
  thread_id IN (
    SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
  )
);

-- Users can insert their own typing indicator
CREATE POLICY "Users can insert their own typing indicator"
ON typing_indicators FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own typing indicator
CREATE POLICY "Users can update their own typing indicator"
ON typing_indicators FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own typing indicator
CREATE POLICY "Users can delete their own typing indicator"
ON typing_indicators FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM typing_indicators WHERE expires_at < now();
END;
$$;

-- 2. MESSAGE STATUS & DELIVERY TRACKING
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'failed')),
ADD COLUMN IF NOT EXISTS edited_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'gif', 'link'));

-- Table to track who has seen each message
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user ON message_read_receipts(user_id);

ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Users can view read receipts for messages in their threads
CREATE POLICY "Users can view read receipts in their threads"
ON message_read_receipts FOR SELECT
USING (
  message_id IN (
    SELECT cm.id FROM chat_messages cm
    WHERE cm.thread_id IN (
      SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
    )
  )
);

-- Users can insert their own read receipts
CREATE POLICY "Users can insert their own read receipts"
ON message_read_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;

-- 3. PINNED MESSAGES
CREATE TABLE IF NOT EXISTS pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_at timestamptz DEFAULT now(),
  UNIQUE(thread_id, message_id)
);

CREATE INDEX idx_pinned_messages_thread ON pinned_messages(thread_id);
CREATE INDEX idx_pinned_messages_message ON pinned_messages(message_id);

ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

-- Users can view pinned messages in their threads
CREATE POLICY "Users can view pinned messages in their threads"
ON pinned_messages FOR SELECT
USING (
  thread_id IN (
    SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
  )
);

-- Thread members can pin messages
CREATE POLICY "Thread members can pin messages"
ON pinned_messages FOR INSERT
WITH CHECK (
  auth.uid() = pinned_by
  AND thread_id IN (
    SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
  )
);

-- Users who pinned can unpin
CREATE POLICY "Users can unpin their own pins"
ON pinned_messages FOR DELETE
USING (auth.uid() = pinned_by);

ALTER PUBLICATION supabase_realtime ADD TABLE pinned_messages;

-- 4. VOICE MESSAGES
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS voice_url text,
ADD COLUMN IF NOT EXISTS voice_duration integer; -- in seconds

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for voice messages storage
CREATE POLICY "Thread members can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
  AND auth.uid() = owner
);

CREATE POLICY "Thread members can view voice messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

-- 5. GIF SUPPORT
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS gif_url text,
ADD COLUMN IF NOT EXISTS gif_title text;

-- 6. LINK PREVIEWS
CREATE TABLE IF NOT EXISTS message_link_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  description text,
  image_url text,
  site_name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, url)
);

CREATE INDEX idx_message_link_previews_message ON message_link_previews(message_id);

ALTER TABLE message_link_previews ENABLE ROW LEVEL SECURITY;

-- Users can view link previews for messages in their threads
CREATE POLICY "Users can view link previews in their threads"
ON message_link_previews FOR SELECT
USING (
  message_id IN (
    SELECT cm.id FROM chat_messages cm
    WHERE cm.thread_id IN (
      SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
    )
  )
);

-- Users can insert link previews for messages they send
CREATE POLICY "Users can insert link previews for their messages"
ON message_link_previews FOR INSERT
WITH CHECK (
  message_id IN (
    SELECT id FROM chat_messages WHERE sender_id = auth.uid()
  )
);

-- 7. MESSAGE FORWARDING
CREATE TABLE IF NOT EXISTS forwarded_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  new_message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  forwarded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forwarded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_forwarded_messages_original ON forwarded_messages(original_message_id);
CREATE INDEX idx_forwarded_messages_new ON forwarded_messages(new_message_id);

ALTER TABLE forwarded_messages ENABLE ROW LEVEL SECURITY;

-- Users can view forwarded message info in their threads
CREATE POLICY "Users can view forwarded message info in their threads"
ON forwarded_messages FOR SELECT
USING (
  new_message_id IN (
    SELECT cm.id FROM chat_messages cm
    WHERE cm.thread_id IN (
      SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
    )
  )
);

-- Users can create forward records for their messages
CREATE POLICY "Users can create forward records"
ON forwarded_messages FOR INSERT
WITH CHECK (auth.uid() = forwarded_by);

-- 8. MULTIPLE IMAGES PER MESSAGE
CREATE TABLE IF NOT EXISTS message_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_message_images_message ON message_images(message_id);

ALTER TABLE message_images ENABLE ROW LEVEL SECURITY;

-- Users can view images for messages in their threads
CREATE POLICY "Users can view message images in their threads"
ON message_images FOR SELECT
USING (
  message_id IN (
    SELECT cm.id FROM chat_messages cm
    WHERE cm.thread_id IN (
      SELECT thread_id FROM thread_members WHERE user_id = auth.uid()
    )
  )
);

-- Users can add images to their messages
CREATE POLICY "Users can add images to their messages"
ON message_images FOR INSERT
WITH CHECK (
  message_id IN (
    SELECT id FROM chat_messages WHERE sender_id = auth.uid()
  )
);

-- 9. USER PREFERENCES
CREATE TABLE IF NOT EXISTS user_chat_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sidebar_width integer DEFAULT 40,
  theme_mode text DEFAULT 'auto',
  message_preview boolean DEFAULT true,
  send_on_enter boolean DEFAULT true,
  link_previews_enabled boolean DEFAULT true,
  read_receipts_enabled boolean DEFAULT true,
  typing_indicators_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_chat_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own preferences
CREATE POLICY "Users can view their own preferences"
ON user_chat_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON user_chat_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON user_chat_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_chat_preferences_updated_at
BEFORE UPDATE ON user_chat_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 10. THREAD ACTIVITY TRACKING
ALTER TABLE chat_threads
ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0;

-- Function to update thread activity
CREATE OR REPLACE FUNCTION update_thread_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_threads
    SET
      last_message_at = NEW.created_at,
      message_count = message_count + 1,
      updated_at = NEW.created_at
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-update thread activity
CREATE TRIGGER update_thread_activity_on_message
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_activity();
