import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WouldYouRatherMetadata } from "@/types/games";

interface WouldYouRatherGameProps {
  gameId: string;
  title: string | null;
  metadata: WouldYouRatherMetadata;
  userId: string;
  onVote: (choice: 'A' | 'B') => void;
  isFinished: boolean;
}

export const WouldYouRatherGame = ({
  gameId,
  title,
  metadata,
  userId,
  onVote,
  isFinished,
}: WouldYouRatherGameProps) => {
  const hasVoted = metadata.optionA.votes.includes(userId) || metadata.optionB.votes.includes(userId);
  const totalVotes = metadata.optionA.votes.length + metadata.optionB.votes.length;
  
  const percentageA = totalVotes > 0 ? (metadata.optionA.votes.length / totalVotes) * 100 : 50;
  const percentageB = totalVotes > 0 ? (metadata.optionB.votes.length / totalVotes) * 100 : 50;

  return (
    <Card className="w-96 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg text-center">
          {title || "Would You Rather?"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Button
              variant={hasVoted && metadata.optionA.votes.includes(userId) ? "default" : "outline"}
              className="w-full h-auto min-h-24 text-wrap p-4"
              onClick={() => onVote('A')}
              disabled={hasVoted || isFinished}
            >
              {metadata.optionA.text}
            </Button>
            {hasVoted && (
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {percentageA.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {metadata.optionA.votes.length} votes
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              variant={hasVoted && metadata.optionB.votes.includes(userId) ? "default" : "outline"}
              className="w-full h-auto min-h-24 text-wrap p-4"
              onClick={() => onVote('B')}
              disabled={hasVoted || isFinished}
            >
              {metadata.optionB.text}
            </Button>
            {hasVoted && (
              <div className="text-center space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {percentageB.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {metadata.optionB.votes.length} votes
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground pt-2">
          {!hasVoted && !isFinished ? "Choose one!" : `${totalVotes} total votes`}
        </div>
      </CardContent>
    </Card>
  );
};
