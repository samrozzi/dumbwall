-- Drop the existing foreign key and recreate it to point to profiles
-- This ensures Supabase can resolve the profiles:created_by relationship

ALTER TABLE public.wall_items
DROP CONSTRAINT IF EXISTS wall_items_created_by_fkey;

ALTER TABLE public.wall_items
ADD CONSTRAINT wall_items_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(id)
ON DELETE CASCADE;