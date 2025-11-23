import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QuestionOfTheDayMetadata } from "@/types/games";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface QuestionOfTheDayGameProps {
  gameId: string;
  title: string | null;
  metadata: QuestionOfTheDayMetadata;
  userId: string;
  onAnswer: (answer: string) => void;
  isFinished: boolean;
}

export const QuestionOfTheDayGame = ({
  gameId,
  title,
  metadata,
  userId,
  onAnswer,
  isFinished,
}: QuestionOfTheDayGameProps) => {
  const [answer, setAnswer] = useState("");
  const hasAnswered = metadata.responses.some(r => r.userId === userId);

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer);
      setAnswer("");
    }
  };

  return (
    <Card className="w-96 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">
          {title || "Question of the Day"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-lg font-medium text-center">
            {metadata.question}
          </p>
        </div>

        {!hasAnswered && !isFinished ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-24"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!answer.trim()}
              className="w-full"
            >
              Submit Answer
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-sm">Responses ({metadata.responses.length})</h4>
            </div>
            <ScrollArea className="h-48 rounded-md border p-3">
              <div className="space-y-3">
                {metadata.responses.map((response, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {response.userId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{response.answer}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(response.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
