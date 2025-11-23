-- Create enum for wall item types
CREATE TYPE wall_item_type AS ENUM ('note', 'image', 'thread', 'game_tictactoe');

-- Create enum for member roles
CREATE TYPE member_role AS ENUM ('owner', 'member');

-- Create circles table
CREATE TABLE circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

-- Create circle_members table
CREATE TABLE circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(circle_id, user_id)
);

ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

-- Create wall_items table
CREATE TABLE wall_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type wall_item_type NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  x integer NOT NULL DEFAULT 0,
  y integer NOT NULL DEFAULT 0,
  z_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE wall_items ENABLE ROW LEVEL SECURITY;

-- Create chat_threads table
CREATE TABLE chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  linked_wall_item_id uuid REFERENCES wall_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

-- Create chat_messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES chat_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create profiles table for user info
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Function to check circle membership
CREATE OR REPLACE FUNCTION is_circle_member(circle_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM circle_members
    WHERE circle_id = circle_uuid
      AND user_id = user_uuid
  )
$$;

-- RLS Policies for circles
CREATE POLICY "Users can view circles they are members of"
  ON circles FOR SELECT
  USING (is_circle_member(id, auth.uid()));

CREATE POLICY "Users can create circles"
  ON circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle owners can update their circles"
  ON circles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- RLS Policies for circle_members
CREATE POLICY "Users can view members of their circles"
  ON circle_members FOR SELECT
  USING (is_circle_member(circle_id, auth.uid()));

CREATE POLICY "Circle owners can add members"
  ON circle_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    ) OR (user_id = auth.uid() AND role = 'member')
  );

CREATE POLICY "Circle owners can remove members"
  ON circle_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
  );

-- RLS Policies for wall_items
CREATE POLICY "Circle members can view wall items"
  ON wall_items FOR SELECT
  USING (is_circle_member(circle_id, auth.uid()));

CREATE POLICY "Circle members can create wall items"
  ON wall_items FOR INSERT
  WITH CHECK (is_circle_member(circle_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Circle members can update wall items"
  ON wall_items FOR UPDATE
  USING (is_circle_member(circle_id, auth.uid()));

CREATE POLICY "Circle members can delete wall items"
  ON wall_items FOR DELETE
  USING (is_circle_member(circle_id, auth.uid()) AND auth.uid() = created_by);

-- RLS Policies for chat_threads
CREATE POLICY "Circle members can view threads"
  ON chat_threads FOR SELECT
  USING (is_circle_member(circle_id, auth.uid()));

CREATE POLICY "Circle members can create threads"
  ON chat_threads FOR INSERT
  WITH CHECK (is_circle_member(circle_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Thread creators can update threads"
  ON chat_threads FOR UPDATE
  USING (is_circle_member(circle_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Thread creators can delete threads"
  ON chat_threads FOR DELETE
  USING (is_circle_member(circle_id, auth.uid()) AND auth.uid() = created_by);

-- RLS Policies for chat_messages
CREATE POLICY "Circle members can view messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_threads ct
      WHERE ct.id = thread_id
        AND is_circle_member(ct.circle_id, auth.uid())
    )
  );

CREATE POLICY "Circle members can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_threads ct
      WHERE ct.id = thread_id
        AND is_circle_member(ct.circle_id, auth.uid())
    ) AND auth.uid() = sender_id
  );

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_circles_updated_at
  BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_circle_members_updated_at
  BEFORE UPDATE ON circle_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wall_items_updated_at
  BEFORE UPDATE ON wall_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE wall_items;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_threads;