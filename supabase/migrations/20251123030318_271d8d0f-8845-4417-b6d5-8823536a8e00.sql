-- Drop the existing foreign key that points to auth.users
ALTER TABLE circle_members 
DROP CONSTRAINT circle_members_user_id_fkey;

-- Add new foreign key constraint pointing to profiles
ALTER TABLE circle_members 
ADD CONSTRAINT circle_members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;