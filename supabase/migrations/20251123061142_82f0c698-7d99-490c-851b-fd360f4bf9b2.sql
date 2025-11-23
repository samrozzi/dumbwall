-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via edge functions)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create game_invites table
CREATE TABLE public.game_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, invited_user_id)
);

-- Enable RLS
ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites they sent or received
CREATE POLICY "Users can view their game invites"
ON public.game_invites
FOR SELECT
USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

-- Game participants can send invites
CREATE POLICY "Game participants can send invites"
ON public.game_invites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.game_participants
    WHERE game_id = game_invites.game_id
    AND user_id = auth.uid()
  )
  AND auth.uid() = invited_by
);

-- Invited users can update their invite status
CREATE POLICY "Invited users can update invite status"
ON public.game_invites
FOR UPDATE
USING (auth.uid() = invited_user_id);