-- Add announcement to wall_item_type enum
ALTER TYPE wall_item_type ADD VALUE IF NOT EXISTS 'announcement';

-- Add username to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add constraint for username format (3-20 chars, alphanumeric + underscore)
ALTER TABLE profiles 
ADD CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Update RLS policy to allow users to update their own username
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Add indexes for faster message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id 
ON chat_messages(thread_id, created_at DESC);

-- Add index for linked wall items filtering
CREATE INDEX IF NOT EXISTS idx_chat_threads_linked_wall_item 
ON chat_threads(linked_wall_item_id) 
WHERE linked_wall_item_id IS NOT NULL;