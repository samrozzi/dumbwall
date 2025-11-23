-- Enum for game types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type') THEN
    CREATE TYPE game_type AS ENUM (
      'tic_tac_toe',
      'poll',
      'would_you_rather',
      'question_of_the_day',
      'story_chain',
      'rate_this'
    );
  END IF;
END$$;

-- Enum for game status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_status') THEN
    CREATE TYPE game_status AS ENUM (
      'waiting',
      'in_progress',
      'finished',
      'cancelled'
    );
  END IF;
END$$;

-- Core games table
CREATE TABLE IF NOT EXISTS public.games (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id     uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  type          game_type NOT NULL,
  status        game_status NOT NULL DEFAULT 'waiting',
  created_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text,
  description   text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Track who is in which game
CREATE TABLE IF NOT EXISTS public.game_participants (
  id            bigserial PRIMARY KEY,
  game_id       uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          text DEFAULT 'player',
  joined_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

-- Generic event/move log per game
CREATE TABLE IF NOT EXISTS public.game_events (
  id            bigserial PRIMARY KEY,
  game_id       uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type    text NOT NULL,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_games_circle ON public.games(circle_id);
CREATE INDEX IF NOT EXISTS idx_games_created_by ON public.games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_game_participants_user ON public.game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_events_game ON public.game_events(game_id);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- Games visible to circle members
CREATE POLICY "Games visible to circle members" ON public.games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = games.circle_id
        AND cm.user_id = auth.uid()
    )
  );

-- Insert games if circle member
CREATE POLICY "Insert games if circle member" ON public.games
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circle_members cm
      WHERE cm.circle_id = games.circle_id
        AND cm.user_id = auth.uid()
    )
  );

-- Update own games
CREATE POLICY "Update own games" ON public.games
  FOR UPDATE USING (created_by = auth.uid());

-- Delete own games
CREATE POLICY "Delete own games" ON public.games
  FOR DELETE USING (created_by = auth.uid());

-- Participants visible to circle members
CREATE POLICY "Select participants visible to circle members" ON public.game_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.circle_members cm ON cm.circle_id = g.circle_id
      WHERE g.id = game_participants.game_id
        AND cm.user_id = auth.uid()
    )
  );

-- Insert participants if circle member
CREATE POLICY "Insert participants if circle member" ON public.game_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.circle_members cm ON cm.circle_id = g.circle_id
      WHERE g.id = game_participants.game_id
        AND cm.user_id = auth.uid()
    )
  );

-- Delete own participation
CREATE POLICY "Delete own participation" ON public.game_participants
  FOR DELETE USING (user_id = auth.uid());

-- Events visible to circle members
CREATE POLICY "Select events visible to circle members" ON public.game_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games g
      JOIN public.circle_members cm ON cm.circle_id = g.circle_id
      WHERE g.id = game_events.game_id
        AND cm.user_id = auth.uid()
    )
  );

-- Insert events by participants
CREATE POLICY "Insert events by participants" ON public.game_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_participants gp
      WHERE gp.game_id = game_events.game_id
        AND gp.user_id = auth.uid()
    )
  );