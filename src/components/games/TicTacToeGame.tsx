import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TicTacToeMetadata } from "@/types/games";

interface TicTacToeGameProps {
  gameId: string;
  title: string | null;
  metadata: TicTacToeMetadata;
  userId: string;
  participants: Array<{
    user_id: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }>;
  onMove: (row: number, col: number) => void;
  onRematch: () => void;
  isFinished: boolean;
}

export const TicTacToeGame = ({
  title,
  metadata,
  userId,
  participants,
  onMove,
  onRematch,
  isFinished,
}: TicTacToeGameProps) => {
  const isMyTurn = metadata.nextTurnUserId === userId;
  const winner = metadata.winnerUserId;
  const isDraw = !winner && metadata.board.every(row => row.every(cell => cell !== null));
  
  const winnerProfile = winner 
    ? participants.find(p => p.user_id === winner)?.profiles 
    : null;

  const handleCellClick = (row: number, col: number) => {
    if (isFinished || !isMyTurn || metadata.board[row][col]) return;
    onMove(row, col);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title || "Tic Tac Toe"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {winner && winnerProfile && (
          <div className="text-center space-y-3">
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
          </div>
        )}
        {isDraw && (
          <div className="text-center text-lg font-semibold text-muted-foreground">
            It's a draw!
          </div>
        )}
        {!isFinished && !isDraw && (
          <div className="text-center text-sm text-muted-foreground">
            {isMyTurn ? "Your turn" : "Opponent's turn"}
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2 max-w-[300px] mx-auto">
          {metadata.board.map((row, rowIdx) =>
            row.map((cell, colIdx) => (
              <Button
                key={`${rowIdx}-${colIdx}`}
                variant="outline"
                className="h-20 text-3xl font-bold"
                onClick={() => handleCellClick(rowIdx, colIdx)}
                disabled={isFinished || !isMyTurn || cell !== null}
              >
                {cell}
              </Button>
            ))
          )}
        </div>
        
        {(isFinished || isDraw) && (
          <Button onClick={onRematch} className="w-full">
            Rematch
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
