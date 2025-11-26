-- Add performance indexes for frequently queried columns
-- This migration improves query performance across the application

-- Games table indexes
CREATE INDEX IF NOT EXISTS idx_games_circle_id ON games(circle_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON games(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_circle_status ON games(circle_id, status);

-- Game participants indexes
CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_game_user ON game_participants(game_id, user_id);

-- Game events indexes
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_created_at ON game_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_events_game_created ON game_events(game_id, created_at DESC);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON chat_messages(thread_id, created_at DESC);

-- Chat threads indexes
CREATE INDEX IF NOT EXISTS idx_chat_threads_circle_id ON chat_threads(circle_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_created_by ON chat_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_threads_updated_at ON chat_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_threads_linked_wall_item ON chat_threads(linked_wall_item_id) WHERE linked_wall_item_id IS NOT NULL;

-- Wall items indexes
CREATE INDEX IF NOT EXISTS idx_wall_items_circle_id ON wall_items(circle_id);
CREATE INDEX IF NOT EXISTS idx_wall_items_created_by ON wall_items(created_by);
CREATE INDEX IF NOT EXISTS idx_wall_items_type ON wall_items(type);
CREATE INDEX IF NOT EXISTS idx_wall_items_created_at ON wall_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wall_items_circle_type ON wall_items(circle_id, type);
CREATE INDEX IF NOT EXISTS idx_wall_items_z_index ON wall_items(z_index);

-- Circle members indexes
CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_role ON circle_members(role);

-- Circles indexes
CREATE INDEX IF NOT EXISTS idx_circles_created_by ON circles(created_by);
CREATE INDEX IF NOT EXISTS idx_circles_updated_at ON circles(updated_at DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);

-- Game invites indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_game_invites_game_id ON game_invites(game_id);
CREATE INDEX IF NOT EXISTS idx_game_invites_invited_user_id ON game_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_game_invites_status ON game_invites(status);
CREATE INDEX IF NOT EXISTS idx_game_invites_user_status ON game_invites(invited_user_id, status);

-- Activities indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities');
CREATE INDEX IF NOT EXISTS idx_activities_circle_id ON activities(circle_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities');
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities');

-- Circle activities indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_circle_activities_circle_id ON circle_activities(circle_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'circle_activities');
CREATE INDEX IF NOT EXISTS idx_circle_activities_user_id ON circle_activities(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'circle_activities');
CREATE INDEX IF NOT EXISTS idx_circle_activities_created_at ON circle_activities(created_at DESC) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'circle_activities');

-- Stories indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories');
CREATE INDEX IF NOT EXISTS idx_stories_circle_id ON stories(circle_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories');
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories');

-- Add comment for documentation
COMMENT ON INDEX idx_games_circle_status IS 'Composite index for filtering games by circle and status';
COMMENT ON INDEX idx_chat_messages_thread_created IS 'Composite index for ordering messages within a thread';
COMMENT ON INDEX idx_wall_items_circle_type IS 'Composite index for filtering wall items by circle and type';
COMMENT ON INDEX idx_game_invites_user_status IS 'Composite index for finding pending invites for a user';
