import { useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TicTacToeProps {
  content: {
    state: string[];
    turn: string;
    winner?: string | null;
    winningLine?: number[] | null;
  };
  onUpdate?: (newState: string[], newTurn: string, winner?: string | null, winningLine?: number[] | null) => void;
  onDelete?: () => void;
}

const TicTacToe = ({ content, onUpdate, onDelete }: TicTacToeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const checkWinner = (state: string[]): { winner: string | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (state[a] && state[a] === state[b] && state[a] === state[c]) {
        return { winner: state[a], line };
      }
    }

    return { winner: null, line: null };
  };

  const checkDraw = (state: string[]): boolean => {
    return state.every((cell) => cell !== "") && !checkWinner(state).winner;
  };

  const handleClick = (index: number) => {
    if (!onUpdate || content.state[index] || content.winner) return;

    const newState = [...content.state];
    newState[index] = content.turn;

    const { winner, line } = checkWinner(newState);
    const isDraw = checkDraw(newState);

    if (winner) {
      onUpdate(newState, content.turn, winner, line);
    } else if (isDraw) {
      onUpdate(newState, content.turn, "draw", null);
    } else {
      const newTurn = content.turn === "X" ? "O" : "X";
      onUpdate(newState, newTurn);
    }
  };

  // Mobile touch handler
  const handleTouch = (e: React.TouchEvent, index: number) => {
    e.preventDefault();
    handleClick(index);
  };

  const handleRematch = () => {
    if (!onUpdate) return;
    const emptyState = Array(9).fill("");
    onUpdate(emptyState, "X", null, null);
  };

  const getStrikethroughStyle = (): React.CSSProperties => {
    if (!content.winningLine) return {};

    const line = content.winningLine;
    const [a, b, c] = line;

    // Rows
    if (a === 0 && b === 1 && c === 2) return { top: "16.66%", left: "0", width: "100%", height: "4px" };
    if (a === 3 && b === 4 && c === 5) return { top: "50%", left: "0", width: "100%", height: "4px" };
    if (a === 6 && b === 7 && c === 8) return { top: "83.33%", left: "0", width: "100%", height: "4px" };

    // Columns
    if (a === 0 && b === 3 && c === 6) return { top: "0", left: "16.66%", width: "4px", height: "100%" };
    if (a === 1 && b === 4 && c === 7) return { top: "0", left: "50%", width: "4px", height: "100%" };
    if (a === 2 && b === 5 && c === 8) return { top: "0", left: "83.33%", width: "4px", height: "100%" };

    // Diagonals
    if (a === 0 && b === 4 && c === 8) {
      return {
        top: "50%",
        left: "50%",
        width: "141%",
        height: "4px",
        transform: "translate(-50%, -50%) rotate(45deg)",
      };
    }
    if (a === 2 && b === 4 && c === 6) {
      return {
        top: "50%",
        left: "50%",
        width: "141%",
        height: "4px",
        transform: "translate(-50%, -50%) rotate(-45deg)",
      };
    }

    return {};
  };

  return (
    <Card
      className="p-4 w-full max-w-sm sm:w-64 mx-auto bg-card shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 transform rotate-1 hover:rotate-0 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {onDelete && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-transform z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="relative">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {content.state.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              onTouchStart={(e) => handleTouch(e, index)}
              className="aspect-square min-h-[60px] bg-accent/20 hover:bg-accent/30 active:bg-accent/40 rounded-md flex items-center justify-center text-2xl font-bold transition-colors disabled:cursor-not-allowed touch-manipulation"
              disabled={!onUpdate || !!cell || !!content.winner}
              style={{ touchAction: 'manipulation' }}
            >
              {cell}
            </button>
          ))}
        </div>

        {content.winningLine && (
          <div
            className="absolute bg-primary animate-in fade-in duration-500"
            style={getStrikethroughStyle()}
          />
        )}
      </div>

      {content.winner && content.winner !== "draw" && (
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-primary animate-in zoom-in duration-300">
            {content.winner} Wins! 🎉
          </p>
          <Button onClick={handleRematch} size="sm" className="w-full">
            Rematch? 🔄
          </Button>
        </div>
      )}

      {content.winner === "draw" && (
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-muted-foreground">It's a Draw!</p>
          <Button onClick={handleRematch} size="sm" className="w-full">
            Rematch? 🔄
          </Button>
        </div>
      )}

      {!content.winner && (
        <p className="text-center text-sm text-muted-foreground">
          Current turn: <span className="font-bold text-foreground">{content.turn}</span>
        </p>
      )}
    </Card>
  );
};

export default TicTacToe;
