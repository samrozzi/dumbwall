-- Add missing game types to the game_type enum
-- These game types are referenced in the code but missing from the database

DO $$ 
BEGIN
  -- Add connect_four if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'connect_four' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'game_type')) THEN
    ALTER TYPE game_type ADD VALUE 'connect_four';
  END IF;
  
  -- Add chess if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'chess' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'game_type')) THEN
    ALTER TYPE game_type ADD VALUE 'chess';
  END IF;
  
  -- Add checkers if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'checkers' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'game_type')) THEN
    ALTER TYPE game_type ADD VALUE 'checkers';
  END IF;
  
  -- Add hangman if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hangman' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'game_type')) THEN
    ALTER TYPE game_type ADD VALUE 'hangman';
  END IF;
  
  -- Add twenty_one_questions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'twenty_one_questions' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'game_type')) THEN
    ALTER TYPE game_type ADD VALUE 'twenty_one_questions';
  END IF;
END $$;