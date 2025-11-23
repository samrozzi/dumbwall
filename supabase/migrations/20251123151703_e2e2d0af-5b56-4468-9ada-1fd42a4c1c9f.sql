-- Fix Critical Security Issues

-- 1. Fix profiles table RLS - restrict to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. Create masked view for circle invites to protect email addresses
CREATE OR REPLACE VIEW circle_invites_masked AS
SELECT 
  id, 
  circle_id, 
  invited_by, 
  status, 
  created_at, 
  updated_at, 
  invite_type,
  CASE 
    WHEN auth.uid() = invited_by OR EXISTS (
      SELECT 1 FROM circle_members 
      WHERE circle_id = circle_invites.circle_id 
      AND user_id = auth.uid() 
      AND role = 'owner'
    )
    THEN invited_email
    ELSE SUBSTRING(invited_email, 1, 2) || '***@' || SPLIT_PART(invited_email, '@', 2)
  END as invited_email
FROM circle_invites;

-- 3. Fix notifications RLS - remove permissive policy and create secure function
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE OR REPLACE FUNCTION create_notification(
  target_user_id uuid,
  notif_type text,
  notif_title text,
  notif_message text,
  notif_link text DEFAULT NULL,
  notif_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Only allow notifications to users in shared circles
  IF NOT EXISTS (
    SELECT 1 FROM circle_members cm1
    JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to notify this user';
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (target_user_id, notif_type, notif_title, notif_message, notif_link, notif_metadata)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- 4. Add database constraints for input validation
DO $$ 
BEGIN
  -- Chat messages length constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_length_limit') THEN
    ALTER TABLE chat_messages 
      ADD CONSTRAINT message_length_limit 
      CHECK (length(body) <= 5000 AND length(body) >= 1);
  END IF;

  -- Username format constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'username_format_check') THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT username_format_check 
      CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$');
  END IF;

  -- Display name length constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'display_name_length_check') THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT display_name_length_check 
      CHECK (display_name IS NULL OR (length(display_name) >= 1 AND length(display_name) <= 100));
  END IF;

  -- Game events payload size constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_size_limit') THEN
    ALTER TABLE game_events 
      ADD CONSTRAINT payload_size_limit 
      CHECK (length(payload::text) < 50000);
  END IF;

  -- Wall items content size constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_size_limit') THEN
    ALTER TABLE wall_items
      ADD CONSTRAINT content_size_limit
      CHECK (length(content::text) < 10000);
  END IF;
END $$;