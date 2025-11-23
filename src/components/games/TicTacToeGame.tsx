import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TicTacToeMetadata } from "@/types/games";

interface TicTacToeGameProps {
  gameId: string;
  title: string | null;
  metadata: TicTacToeMetadata;
  userId: string;
  onMove: (row: number, col: number) => void;
  isFinished: boolean;
}

export const TicTacToeGame = ({
  title,
  metadata,
  userId,
  onMove,
  isFinished,
}: TicTacToeGameProps) => {
  const isMyTurn = metadata.nextTurnUserId === userId;
  const winner = metadata.winnerUserId;
  const isDraw = !winner && metadata.board.every(row => row.every(cell => cell !== null));

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
        {winner && (
          <div className="text-center text-lg font-semibold text-primary">
            {winner === userId ? "You won! 🎉" : "You lost"}
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
      </CardContent>
    </Card>
  );
};
