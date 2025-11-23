-- Create wall_item_comments table
CREATE TABLE wall_item_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_item_id uuid NOT NULL REFERENCES wall_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_wall_item_comments_wall_item_id ON wall_item_comments(wall_item_id);
CREATE INDEX idx_wall_item_comments_user_id ON wall_item_comments(user_id);

-- Create wall_item_reactions table
CREATE TABLE wall_item_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_item_id uuid NOT NULL REFERENCES wall_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wall_item_id, user_id, emoji)
);

CREATE INDEX idx_wall_item_reactions_wall_item_id ON wall_item_reactions(wall_item_id);

-- Create wall_item_votes table
CREATE TABLE wall_item_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_item_id uuid NOT NULL REFERENCES wall_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(wall_item_id, user_id)
);

CREATE INDEX idx_wall_item_votes_wall_item_id ON wall_item_votes(wall_item_id);

-- RLS Policies for wall_item_comments
ALTER TABLE wall_item_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their circles"
ON wall_item_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wall_items wi
    WHERE wi.id = wall_item_comments.wall_item_id
    AND is_circle_member(wi.circle_id, auth.uid())
  )
);

CREATE POLICY "Users can add comments in their circles"
ON wall_item_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wall_items wi
    WHERE wi.id = wall_item_comments.wall_item_id
    AND is_circle_member(wi.circle_id, auth.uid())
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete their own comments"
ON wall_item_comments FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for wall_item_reactions
ALTER TABLE wall_item_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions in their circles"
ON wall_item_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wall_items wi
    WHERE wi.id = wall_item_reactions.wall_item_id
    AND is_circle_member(wi.circle_id, auth.uid())
  )
);

CREATE POLICY "Users can add reactions in their circles"
ON wall_item_reactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wall_items wi
    WHERE wi.id = wall_item_reactions.wall_item_id
    AND is_circle_member(wi.circle_id, auth.uid())
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete their own reactions"
ON wall_item_reactions FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for wall_item_votes
ALTER TABLE wall_item_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view votes in their circles"
ON wall_item_votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM wall_items wi
    WHERE wi.id = wall_item_votes.wall_item_id
    AND is_circle_member(wi.circle_id, auth.uid())
  )
);

CREATE POLICY "Users can vote in their circles"
ON wall_item_votes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM wall_items wi
    WHERE wi.id = wall_item_votes.wall_item_id
    AND is_circle_member(wi.circle_id, auth.uid())
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own votes"
ON wall_item_votes FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes"
ON wall_item_votes FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE wall_item_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE wall_item_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE wall_item_votes;