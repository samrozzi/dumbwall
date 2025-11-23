-- Update NULL usernames with a default pattern
UPDATE profiles 
SET username = 'user_' || SUBSTRING(id::text FROM 1 FOR 8)
WHERE username IS NULL;

-- Make username required
ALTER TABLE profiles 
ALTER COLUMN username SET NOT NULL;

-- Make username unique
ALTER TABLE profiles 
ADD CONSTRAINT unique_username UNIQUE (username);