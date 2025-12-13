-- Create overrun_submissions table for public form submissions
CREATE TABLE public.overrun_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  description TEXT,
  contact_email TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.overrun_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can submit overrun forms"
ON public.overrun_submissions
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view submissions (for admin purposes later)
CREATE POLICY "Authenticated users can view submissions"
ON public.overrun_submissions
FOR SELECT
USING (auth.uid() IS NOT NULL);