-- Create circle_stories table for 24-hour temporary content
CREATE TABLE public.circle_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'text', 'poll')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_stories_circle ON public.circle_stories(circle_id);
CREATE INDEX idx_stories_expiry ON public.circle_stories(expires_at);
CREATE INDEX idx_stories_user ON public.circle_stories(user_id);

-- Enable RLS
ALTER TABLE public.circle_stories ENABLE ROW LEVEL SECURITY;

-- Circle members can view stories
CREATE POLICY "Circle members can view stories"
ON public.circle_stories
FOR SELECT
USING (is_circle_member(circle_id, auth.uid()));

-- Circle members can create stories
CREATE POLICY "Circle members can create stories"
ON public.circle_stories
FOR INSERT
WITH CHECK (is_circle_member(circle_id, auth.uid()) AND auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete own stories"
ON public.circle_stories
FOR DELETE
USING (auth.uid() = user_id);

-- Create circle_activities table
CREATE TABLE public.circle_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'wall_post', 'game_win', 'status_change', 'thread_join', 
    'poll_create', 'story_add', 'member_join'
  )),
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_circle ON public.circle_activities(circle_id);
CREATE INDEX idx_activities_created_at ON public.circle_activities(created_at DESC);
CREATE INDEX idx_activities_user ON public.circle_activities(user_id);

-- Enable RLS
ALTER TABLE public.circle_activities ENABLE ROW LEVEL SECURITY;

-- Circle members can view activities
CREATE POLICY "Circle members can view activities"
ON public.circle_activities
FOR SELECT
USING (is_circle_member(circle_id, auth.uid()));

-- Trigger function to log wall post activities
CREATE OR REPLACE FUNCTION public.log_wall_post_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.circle_activities (
    circle_id,
    user_id,
    activity_type,
    reference_id,
    reference_type,
    metadata
  ) VALUES (
    NEW.circle_id,
    NEW.created_by,
    'wall_post',
    NEW.id,
    'wall_item',
    jsonb_build_object(
      'item_type', NEW.type,
      'content', NEW.content
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for wall posts
CREATE TRIGGER log_wall_post_trigger
AFTER INSERT ON public.wall_items
FOR EACH ROW
EXECUTE FUNCTION public.log_wall_post_activity();

-- Trigger function to log story activities
CREATE OR REPLACE FUNCTION public.log_story_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.circle_activities (
    circle_id,
    user_id,
    activity_type,
    reference_id,
    reference_type,
    metadata
  ) VALUES (
    NEW.circle_id,
    NEW.user_id,
    'story_add',
    NEW.id,
    'story',
    jsonb_build_object(
      'story_type', NEW.type
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for stories
CREATE TRIGGER log_story_trigger
AFTER INSERT ON public.circle_stories
FOR EACH ROW
EXECUTE FUNCTION public.log_story_activity();

-- Trigger function to log member join activities
CREATE OR REPLACE FUNCTION public.log_member_join_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.circle_activities (
    circle_id,
    user_id,
    activity_type,
    reference_id,
    reference_type,
    metadata
  ) VALUES (
    NEW.circle_id,
    NEW.user_id,
    'member_join',
    NEW.id,
    'member',
    '{}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Create trigger for member joins
CREATE TRIGGER log_member_join_trigger
AFTER INSERT ON public.circle_members
FOR EACH ROW
EXECUTE FUNCTION public.log_member_join_activity();

-- Function to cleanup expired stories
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.circle_stories
  WHERE expires_at < now();
END;
$$;