-- Create pinned_threads table for thread pinning
CREATE TABLE public.pinned_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.pinned_threads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own pinned threads
CREATE POLICY "Users can manage their own pinned threads"
ON public.pinned_threads FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_pinned_threads_user_id ON public.pinned_threads(user_id);
CREATE INDEX idx_pinned_threads_thread_id ON public.pinned_threads(thread_id);