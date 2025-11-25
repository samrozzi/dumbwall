import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectFourMetadata } from "@/types/games";

interface ConnectFourGameProps {
  gameId: string;
  title: string | null;
  metadata: ConnectFourMetadata;
  userId: string;
  onDrop: (col: number) => void;
  onRematch: () => void;
  isFinished: boolean;
  isCreatingRematch: boolean;
}

export const ConnectFourGame = ({
  title,
  metadata,
  userId,
  onDrop,
  onRematch,
  isFinished,
  isCreatingRematch,
}: ConnectFourGameProps) => {
  const myColor = metadata.redPlayer === userId ? 'red' : 'yellow';
  const isMyTurn = metadata.currentTurn === myColor;
  const winner = metadata.winnerUserId;
  
  // Check for draw (board full, no winner)
  const isDraw = !winner && metadata.board[0].every(cell => cell !== null);

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
        {/* Winner/Draw Display */}
        {(winner || isDraw) && (
          <div className="text-center space-y-2 pb-4 border-b">
            {winner && (
              <div className="text-lg font-semibold">
                <span className="text-primary text-xl">
                  {winner === userId ? "You won! 🎉" : winner === 'computer' ? "Computer wins!" : "Opponent wins!"}
                </span>
              </div>
            )}
            {isDraw && (
              <div className="text-lg font-semibold text-muted-foreground">
                Draw! Board is full.
              </div>
            )}
          </div>
        )}
        
        {/* Turn Indicator */}
        {!isFinished && !isDraw && (
          <div className="text-center text-sm">
            <div className="font-medium">
              You are <span className={myColor === 'red' ? 'text-red-500' : 'text-yellow-500'}>{myColor}</span>
            </div>
            <div className="text-muted-foreground">
              {isMyTurn ? "Your turn ⬇️" : metadata.yellowPlayer === 'computer' ? "Computer's turn..." : "Opponent's turn"}
            </div>
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
        
        {/* Rematch Button */}
        {(isFinished || isDraw) && (
          <Button 
            onClick={onRematch} 
            disabled={isCreatingRematch}
            className="w-full"
          >
            {isCreatingRematch ? "Creating..." : "Play Again"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
