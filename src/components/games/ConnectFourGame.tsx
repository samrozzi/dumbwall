import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectFourMetadata } from "@/types/games";

interface ConnectFourGameProps {
  gameId: string;
  title: string | null;
  metadata: ConnectFourMetadata;
  userId: string;
  onDrop: (col: number) => void;
  isFinished: boolean;
}

export const ConnectFourGame = ({
  title,
  metadata,
  userId,
  onDrop,
  isFinished,
}: ConnectFourGameProps) => {
  const myColor = metadata.redPlayer === userId ? 'red' : 'yellow';
  const isMyTurn = metadata.currentTurn === myColor;
  const winner = metadata.winnerUserId;

  const getPieceColor = (piece: 'R' | 'Y' | null) => {
    if (!piece) return "bg-background";
    return piece === 'R' ? "bg-red-500" : "bg-yellow-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title || "Connect Four"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {winner && (
          <div className="text-center text-lg font-semibold text-primary">
            {winner === userId ? "You won! 🎉" : "You lost"}
          </div>
        )}
        {!isFinished && (
          <div className="text-center text-sm text-muted-foreground">
            You are {myColor} - {isMyTurn ? "Your turn" : "Opponent's turn"}
          </div>
        )}
        
        <div className="space-y-2 max-w-[450px] mx-auto">
          {/* Drop buttons */}
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((col) => (
              <Button
                key={col}
                variant="secondary"
                size="sm"
                onClick={() => onDrop(col)}
                disabled={isFinished || !isMyTurn || metadata.board[0][col] !== null}
              >
                ↓
              </Button>
            ))}
          </div>
          
          {/* Board */}
          <div className="grid grid-cols-7 gap-2 bg-blue-600 p-2 rounded-lg">
            {metadata.board.map((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`aspect-square rounded-full ${getPieceColor(cell)} border-2 border-blue-700`}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
