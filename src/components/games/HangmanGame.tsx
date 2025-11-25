import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HangmanMetadata } from "@/types/games";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface HangmanGameProps {
  gameId: string;
  title: string | null;
  metadata: HangmanMetadata;
  userId: string;
  createdBy: string;
  participants: Array<{
    user_id: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }>;
  onGuess: (letter: string) => void;
  onRematch: () => void;
  isFinished: boolean;
  onSetWord?: (word: string, hint: string) => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Word lists by difficulty
const WORD_LISTS = {
  easy: ['APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EAGLE', 'FIELD', 'GRAPE', 'HEART', 'LIGHT', 'MUSIC', 'OCEAN', 'PIANO', 'RIVER', 'SMILE', 'TIGER', 'WATER'],
  medium: ['BASKET', 'CASTLE', 'GARDEN', 'JUNGLE', 'KNIGHT', 'MARKET', 'PENCIL', 'ROCKET', 'SCHOOL', 'SUMMER', 'TEMPLE', 'WINTER', 'YELLOW'],
  hard: ['BUTTERFLY', 'CHAMPION', 'ELEPHANT', 'FOOTBALL', 'KEYBOARD', 'MOUNTAIN', 'PAINTING', 'QUESTION', 'SURPRISE', 'UMBRELLA', 'VACATION']
};

const getRandomWord = (difficulty: string): string => {
  const words = WORD_LISTS[difficulty as keyof typeof WORD_LISTS] || WORD_LISTS.medium;
  return words[Math.floor(Math.random() * words.length)];
};

// Hangman drawing stages
const HANGMAN_STAGES = [
  // Stage 0: Empty
  `
   ___
  |
  |
  |
  |
  |___
  `,
  // Stage 1: Head
  `
   ___
  |   |
  |   O
  |
  |
  |___
  `,
  // Stage 2: Body
  `
   ___
  |   |
  |   O
  |   |
  |
  |___
  `,
  // Stage 3: Left arm
  `
   ___
  |   |
  |   O
  |  /|
  |
  |___
  `,
  // Stage 4: Right arm
  `
   ___
  |   |
  |   O
  |  /|\\
  |
  |___
  `,
  // Stage 5: Left leg
  `
   ___
  |   |
  |   O
  |  /|\\
  |  /
  |___
  `,
  // Stage 6: Right leg (game over)
  `
   ___
  |   |
  |   O
  |  /|\\
  |  / \\
  |___
  `,
];

export const HangmanGame = ({
  title,
  metadata,
  userId,
  createdBy,
  participants,
  onGuess,
  onRematch,
  isFinished,
  onSetWord,
}: HangmanGameProps) => {
  const [wordInput, setWordInput] = useState('');
  const [hintInput, setHintInput] = useState('');
  
  const isMyTurn = metadata.currentTurn === userId;
  const winner = metadata.winnerUserId;
  const gameOver = metadata.incorrectGuesses >= metadata.maxGuesses;
  const isCreator = createdBy === userId;
  const needsWord = !metadata.word || metadata.word === '';
  const isWaitingForWord = needsWord && isCreator && !metadata.isComputerOpponent;

  const winnerProfile = winner
    ? participants.find(p => p.user_id === winner)?.profiles
    : null;

  // Calculate displayed word with guessed letters
  const displayWord = metadata.word
    .split("")
    .map(letter =>
      metadata.guessedLetters.includes(letter) ? letter : "_"
    )
    .join(" ");

  const isWordGuessed = metadata.word
    .split("")
    .every(letter => metadata.guessedLetters.includes(letter));

  const handleLetterClick = (letter: string) => {
    if (
      isFinished ||
      !isMyTurn ||
      metadata.guessedLetters.includes(letter) ||
      gameOver ||
      isWordGuessed ||
      needsWord
    ) return;

    onGuess(letter);
  };

  const handleSetWord = () => {
    if (!wordInput.trim() || wordInput.length < 3) return;
    const upperWord = wordInput.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (upperWord.length < 3) return;
    
    onSetWord?.(upperWord, hintInput.trim());
  };

  const hangmanDrawing = HANGMAN_STAGES[Math.min(metadata.incorrectGuesses, 6)];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title || "Hangman"}</span>
          {metadata.isComputerOpponent && (
            <span className="text-sm font-normal text-muted-foreground">vs Computer</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Word Setup for Creator */}
        {isWaitingForWord && (
          <div className="space-y-4 p-6 border-2 border-dashed border-primary/30 rounded-lg bg-muted/50">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Set the Word</h3>
              <p className="text-sm text-muted-foreground">
                Choose a word for your opponent to guess
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="word">Word to Guess</Label>
                <Input
                  id="word"
                  type="text"
                  placeholder="Enter a word (letters only)"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value.toUpperCase())}
                  maxLength={15}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  3-15 letters, no spaces or numbers
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hint">Hint (Optional)</Label>
                <Input
                  id="hint"
                  type="text"
                  placeholder="Give your opponent a clue..."
                  value={hintInput}
                  onChange={(e) => setHintInput(e.target.value)}
                  maxLength={50}
                />
              </div>
              <Button 
                onClick={handleSetWord} 
                disabled={!wordInput.trim() || wordInput.length < 3}
                className="w-full"
              >
                Start Game
              </Button>
            </div>
          </div>
        )}

        {/* Waiting for opponent to set word */}
        {needsWord && !isCreator && !metadata.isComputerOpponent && (
          <div className="text-center p-8 space-y-2">
            <p className="text-lg font-semibold">Waiting for word...</p>
            <p className="text-sm text-muted-foreground">
              Your opponent is choosing a word for you to guess
            </p>
          </div>
        )}

        {/* Winner/Game Over Display */}
        {!needsWord && (winner || gameOver) && (
          <div className="text-center space-y-3 pb-4 border-b">
            {winner && winnerProfile && (
              <>
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarImage src={winnerProfile.avatar_url || ""} />
                  <AvatarFallback>
                    {winnerProfile.display_name?.[0] || winnerProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {winnerProfile.display_name || `@${winnerProfile.username}`}
                  </p>
                  <p className="text-primary text-xl font-bold">
                    {winner === userId ? "You won! 🎉" : "Wins! 🎉"}
                  </p>
                </div>
              </>
            )}
            {gameOver && !winner && (
              <div>
                <p className="text-destructive text-xl font-bold">Game Over!</p>
                <p className="text-muted-foreground mt-2">
                  The word was: <span className="font-bold text-foreground">{metadata.word}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {isWordGuessed && !isFinished && (
          <div className="text-center pb-4 border-b">
            <p className="text-primary text-xl font-bold">Word Guessed! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">
              The word was: <span className="font-semibold">{metadata.word}</span>
            </p>
          </div>
        )}

        {/* Hint */}
        {!needsWord && metadata.wordHint && (
          <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            💡 Hint: {metadata.wordHint}
          </div>
        )}

        {/* Hangman Drawing */}
        {!needsWord && (
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-center font-mono text-sm">
            {hangmanDrawing}
          </pre>
          <div className="text-center mt-2 text-sm text-muted-foreground">
            {metadata.maxGuesses - metadata.incorrectGuesses} guesses remaining
          </div>
        </div>
        )}

        {/* Word Display */}
        {!needsWord && (
        <div className="text-center">
          <div className="text-3xl font-bold tracking-widest mb-2 font-mono">
            {displayWord}
          </div>
          <div className="text-sm text-muted-foreground">
            {metadata.word.length} letters
          </div>
        </div>
        )}

        {/* Turn Indicator */}
        {!needsWord && !isFinished && !gameOver && !isWordGuessed && (
          <div className="text-center text-sm text-muted-foreground">
            {isMyTurn ? "Your turn - Choose a letter" : "Opponent's turn"}
          </div>
        )}

        {/* Letter Buttons */}
        {!needsWord && !gameOver && !isWordGuessed && (
          <div className="grid grid-cols-7 gap-1">
            {ALPHABET.map((letter) => {
              const isGuessed = metadata.guessedLetters.includes(letter);
              const isCorrect = isGuessed && metadata.word.includes(letter);
              const isIncorrect = isGuessed && !metadata.word.includes(letter);

              return (
                <Button
                  key={letter}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 text-sm font-bold",
                    isCorrect && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400",
                    isIncorrect && "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400",
                    !isGuessed && isMyTurn && "hover:scale-110 transition-transform"
                  )}
                  onClick={() => handleLetterClick(letter)}
                  disabled={isFinished || !isMyTurn || isGuessed}
                >
                  {letter}
                </Button>
              );
            })}
          </div>
        )}

        {/* Rematch Button */}
        {(isFinished || gameOver || isWordGuessed) && (
          <Button onClick={onRematch} className="w-full">
            Play Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
