-- Fix wall_items DELETE policy to allow any circle member to delete
DROP POLICY IF EXISTS "Circle members can delete wall items" ON wall_items;

CREATE POLICY "Circle members can delete wall items"
ON wall_items
FOR DELETE
USING (is_circle_member(circle_id, auth.uid()));

-- Function to detect and notify @mentions
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mention_pattern TEXT := '@([a-zA-Z0-9_]+)';
  mentioned_username TEXT;
  mentioned_user_id UUID;
  thread_title TEXT;
  circle_uuid UUID;
BEGIN
  -- Get thread info for notification link
  SELECT title, circle_id INTO thread_title, circle_uuid
  FROM chat_threads
  WHERE id = NEW.thread_id;

  -- Find all @mentions in the message
  FOR mentioned_username IN
    SELECT unnest(regexp_matches(NEW.body, mention_pattern, 'g'))
  LOOP
    -- Look up user ID by username
    SELECT id INTO mentioned_user_id
    FROM profiles
    WHERE username = mentioned_username;

    -- Create notification if user found and not self-mention
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.sender_id THEN
      PERFORM create_notification(
        mentioned_user_id,
        'mention',
        'You were mentioned',
        'Someone mentioned you in ' || COALESCE(thread_title, 'a thread'),
        '/circle/' || circle_uuid || '/chat?threadId=' || NEW.thread_id,
        jsonb_build_object('message_id', NEW.id, 'thread_id', NEW.thread_id)
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on message insert for mentions
DROP TRIGGER IF EXISTS on_message_mention ON chat_messages;
CREATE TRIGGER on_message_mention
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_mentions();

-- Function to notify game invites
CREATE OR REPLACE FUNCTION notify_game_invite()
RETURNS TRIGGER AS $$
DECLARE
  game_title TEXT;
  circle_uuid UUID;
  inviter_name TEXT;
BEGIN
  -- Get game info
  SELECT g.title, g.circle_id INTO game_title, circle_uuid
  FROM games g
  WHERE g.id = NEW.game_id;
  
  -- Get inviter name
  SELECT COALESCE(display_name, username) INTO inviter_name
  FROM profiles
  WHERE id = NEW.invited_by;

  -- Create notification for invited user
  PERFORM create_notification(
    NEW.invited_user_id,
    'game_invite',
    'Game Invitation',
    COALESCE(inviter_name, 'Someone') || ' invited you to play ' || COALESCE(game_title, 'a game'),
    '/circle/' || circle_uuid || '/games',
    jsonb_build_object('game_id', NEW.game_id, 'invite_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on game invite insert
DROP TRIGGER IF EXISTS on_game_invite_created ON game_invites;
CREATE TRIGGER on_game_invite_created
  AFTER INSERT ON game_invites
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_invite();