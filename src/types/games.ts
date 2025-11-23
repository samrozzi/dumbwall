export type GameType =
  | 'tic_tac_toe'
  | 'poll'
  | 'would_you_rather'
  | 'question_of_the_day'
  | 'story_chain'
  | 'rate_this';

export type GameStatus =
  | 'waiting'
  | 'in_progress'
  | 'finished'
  | 'cancelled';

export interface Game {
  id: string;
  circle_id: string;
  type: GameType;
  status: GameStatus;
  created_by: string;
  title: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface GameParticipant {
  id: number;
  game_id: string;
  user_id: string;
  role: 'player' | 'owner' | 'viewer' | string;
  joined_at: string;
}

export interface GameEvent {
  id: number;
  game_id: string;
  user_id: string | null;
  event_type: string;
  payload: any;
  created_at: string;
}

// Metadata interfaces for specific game types
export interface TicTacToeMetadata {
  board: ('X' | 'O' | null)[][];
  nextTurnUserId: string | null;
  winnerUserId?: string | null;
}

export interface PollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface PollMetadata {
  options: PollOption[];
  allowMultiple: boolean;
  closesAt?: string | null;
}

export interface WouldYouRatherMetadata {
  optionA: { text: string; votes: string[] };
  optionB: { text: string; votes: string[] };
}

export interface QuestionOfTheDayMetadata {
  question: string;
  responses: { userId: string; answer: string; timestamp: string }[];
}

export interface StoryChainMetadata {
  storyParts: { userId: string; text: string; timestamp: string }[];
  maxCharacters: number;
}

export interface RateThisMetadata {
  subject: string;
  imageUrl?: string;
  ratings: { userId: string; rating: number; timestamp: string }[];
  maxRating: number;
}
