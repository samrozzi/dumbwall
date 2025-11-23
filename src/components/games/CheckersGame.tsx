import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckersMetadata } from "@/types/games";
import { useState } from "react";

interface CheckersGameProps {
  gameId: string;
  title: string | null;
  metadata: CheckersMetadata;
  userId: string;
  onMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
  isFinished: boolean;
}

export const CheckersGame = ({
  title,
  metadata,
  userId,
  onMove,
  isFinished,
}: CheckersGameProps) => {
  const [selectedCell, setSelectedCell] = useState<{row: number; col: number} | null>(null);
  
  const myColor = metadata.redPlayer === userId ? 'red' : 'black';
  const isMyTurn = metadata.currentTurn === myColor;
  const winner = metadata.winnerUserId;

  const handleCellClick = (row: number, col: number) => {
    if (isFinished || !isMyTurn) return;

    const piece = metadata.board[row][col];
    
    if (selectedCell) {
      // Try to move
      if (!piece || (piece.toLowerCase() !== myColor[0])) {
        onMove(selectedCell.row, selectedCell.col, row, col);
        setSelectedCell(null);
      } else {
        setSelectedCell({ row, col });
      }
    } else if (piece && piece.toLowerCase() === myColor[0]) {
      setSelectedCell({ row, col });
    }
  };

  const getCellColor = (row: number, col: number) => {
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      return "bg-accent";
    }
    return (row + col) % 2 === 0 ? "bg-muted" : "bg-background";
  };

  const getPieceEmoji = (piece: 'R' | 'r' | 'B' | 'b' | null) => {
    if (!piece) return "";
    if (piece === 'R') return "🔴";
    if (piece === 'r') return "👑";
    if (piece === 'B') return "⚫";
    if (piece === 'b') return "👑";
    return "";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title || "Checkers"}</CardTitle>
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
        
        <div className="grid grid-cols-8 gap-0 max-w-[400px] mx-auto border border-border">
          {metadata.board.map((row, rowIdx) =>
            row.map((cell, colIdx) => (
              <button
                key={`${rowIdx}-${colIdx}`}
                className={`aspect-square flex items-center justify-center text-3xl ${getCellColor(rowIdx, colIdx)} border border-border/50 hover:opacity-80 disabled:cursor-not-allowed`}
                onClick={() => handleCellClick(rowIdx, colIdx)}
                disabled={isFinished || !isMyTurn}
              >
                {getPieceEmoji(cell)}
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
