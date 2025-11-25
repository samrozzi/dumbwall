-- Add missing game types to the game_type enum
-- Current enum only has: tic_tac_toe, poll, would_you_rather, question_of_the_day, story_chain, rate_this
-- Need to add: checkers, connect_four, chess, hangman, twenty_one_questions

DO $$
BEGIN
  -- Add checkers if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'checkers' AND enumtypid = 'game_type'::regtype) THEN
    ALTER TYPE game_type ADD VALUE 'checkers';
  END IF;

  -- Add connect_four if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'connect_four' AND enumtypid = 'game_type'::regtype) THEN
    ALTER TYPE game_type ADD VALUE 'connect_four';
  END IF;

  -- Add chess if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'chess' AND enumtypid = 'game_type'::regtype) THEN
    ALTER TYPE game_type ADD VALUE 'chess';
  END IF;

  -- Add hangman if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'hangman' AND enumtypid = 'game_type'::regtype) THEN
    ALTER TYPE game_type ADD VALUE 'hangman';
  END IF;

  -- Add twenty_one_questions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'twenty_one_questions' AND enumtypid = 'game_type'::regtype) THEN
    ALTER TYPE game_type ADD VALUE 'twenty_one_questions';
  END IF;
END$$;
