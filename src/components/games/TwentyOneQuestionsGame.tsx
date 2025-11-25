import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TwentyOneQuestionsMetadata } from "@/types/games";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";

interface TwentyOneQuestionsGameProps {
  gameId: string;
  title: string | null;
  metadata: TwentyOneQuestionsMetadata;
  userId: string;
  participants: Array<{
    user_id: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }>;
  onAskQuestion: (question: string) => void;
  onAnswerQuestion: (answer: 'yes' | 'no' | 'maybe') => void;
  onMakeGuess: (guess: string) => void;
  onRematch: () => void;
  isFinished: boolean;
}

export const TwentyOneQuestionsGame = ({
  title,
  metadata,
  userId,
  participants,
  onAskQuestion,
  onAnswerQuestion,
  onMakeGuess,
  onRematch,
  isFinished,
}: TwentyOneQuestionsGameProps) => {
  const [question, setQuestion] = useState("");
  const [guess, setGuess] = useState("");

  const isThinker = metadata.thinkerUserId === userId;
  const isGuesser = metadata.guesserUserId === userId;
  const winner = metadata.winnerUserId;
  const questionsLeft = metadata.maxQuestions - metadata.currentQuestion;
  const gameOver = metadata.currentQuestion >= metadata.maxQuestions || !!winner;

  const winnerProfile = winner
    ? participants.find(p => p.user_id === winner)?.profiles
    : null;

  const thinkerProfile = participants.find(
    p => p.user_id === metadata.thinkerUserId
  )?.profiles;

  const guesserProfile = participants.find(
    p => p.user_id === metadata.guesserUserId
  )?.profiles;

  // Check if waiting for answer (last question hasn't been answered yet)
  const waitingForAnswer =
    metadata.questions.length > 0 &&
    metadata.questions[metadata.questions.length - 1].answer === undefined;

  const handleAskQuestion = () => {
    if (!question.trim() || !isGuesser || waitingForAnswer) return;
    onAskQuestion(question.trim());
    setQuestion("");
  };

  const handleMakeGuess = () => {
    if (!guess.trim() || !isGuesser) return;
    onMakeGuess(guess.trim());
    setGuess("");
  };

  const getAnswerIcon = (answer: 'yes' | 'no' | 'maybe') => {
    switch (answer) {
      case 'yes':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'no':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'maybe':
        return <HelpCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getAnswerColor = (answer: 'yes' | 'no' | 'maybe') => {
    switch (answer) {
      case 'yes':
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500";
      case 'no':
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500";
      case 'maybe':
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title || "21 Questions"}</span>
          <Badge variant="secondary">
            {questionsLeft} questions left
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner Display */}
        {winner && winnerProfile && (
          <div className="text-center space-y-3 pb-4 border-b">
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
              {metadata.correctGuess && (
                <p className="text-sm text-muted-foreground mt-2">
                  Correct answer: <span className="font-semibold text-foreground">{metadata.correctGuess}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Game Over - No Winner */}
        {gameOver && !winner && (
          <div className="text-center pb-4 border-b">
            <p className="text-muted-foreground text-lg font-semibold">Game Over</p>
            <p className="text-sm text-muted-foreground mt-2">
              The answer was: <span className="font-bold text-foreground">{metadata.subject}</span>
            </p>
          </div>
        )}

        {/* Players Info */}
        <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
          <div className="flex items-center gap-2">
            {thinkerProfile && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={thinkerProfile.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {thinkerProfile.display_name?.[0] || thinkerProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">Thinker</div>
                  <div className="text-muted-foreground text-xs">
                    {thinkerProfile.display_name || `@${thinkerProfile.username}`}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {guesserProfile && (
              <>
                <div className="text-sm text-right">
                  <div className="font-medium">Guesser</div>
                  <div className="text-muted-foreground text-xs">
                    {guesserProfile.display_name || `@${guesserProfile.username}`}
                  </div>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={guesserProfile.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {guesserProfile.display_name?.[0] || guesserProfile.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        </div>

        {/* Questions History */}
        {metadata.questions.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Questions Asked</h3>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {metadata.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-muted p-3 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">
                        {idx + 1}. {q.question}
                      </p>
                      <Badge
                        variant="outline"
                        className={getAnswerColor(q.answer)}
                      >
                        <span className="flex items-center gap-1">
                          {getAnswerIcon(q.answer)}
                          {q.answer.charAt(0).toUpperCase() + q.answer.slice(1)}
                        </span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Waiting for Answer Notification */}
        {waitingForAnswer && isThinker && !gameOver && (
          <div className="bg-primary/10 border border-primary p-3 rounded-lg text-center">
            <p className="text-sm font-medium">
              Answer the question above with Yes, No, or Maybe
            </p>
          </div>
        )}

        {waitingForAnswer && isGuesser && !gameOver && (
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Waiting for {thinkerProfile?.display_name || "thinker"} to answer...
            </p>
          </div>
        )}

        {/* Answer Question (Thinker) */}
        {waitingForAnswer && isThinker && !gameOver && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => onAnswerQuestion('yes')}
                variant="outline"
                className="border-green-500 hover:bg-green-500/10"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Yes
              </Button>
              <Button
                onClick={() => onAnswerQuestion('no')}
                variant="outline"
                className="border-red-500 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4 mr-1" />
                No
              </Button>
              <Button
                onClick={() => onAnswerQuestion('maybe')}
                variant="outline"
                className="border-yellow-500 hover:bg-yellow-500/10"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Maybe
              </Button>
            </div>
          </div>
        )}

        {/* Ask Question (Guesser) */}
        {!waitingForAnswer && isGuesser && !gameOver && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a yes/no question..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAskQuestion();
                  }
                }}
              />
              <Button onClick={handleAskQuestion} disabled={!question.trim()}>
                Ask
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ask questions that can be answered with Yes, No, or Maybe
            </p>
          </div>
        )}

        {/* Make a Guess (Guesser) */}
        {!waitingForAnswer && isGuesser && !gameOver && (
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold text-sm">Think you know? Make a guess!</h3>
            <div className="flex gap-2">
              <Input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter your guess..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleMakeGuess();
                  }
                }}
              />
              <Button onClick={handleMakeGuess} disabled={!guess.trim()} variant="default">
                Guess
              </Button>
            </div>
          </div>
        )}

        {/* Waiting for Guesser */}
        {!waitingForAnswer && isThinker && !gameOver && (
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Waiting for {guesserProfile?.display_name || "guesser"} to ask a question...
            </p>
          </div>
        )}

        {/* Rematch Button */}
        {(isFinished || gameOver) && (
          <Button onClick={onRematch} className="w-full">
            Play Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
