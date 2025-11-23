import { useState } from "react";
import { Card } from "@/components/ui/card";
import { X as XIcon } from "lucide-react";

interface TicTacToeProps {
  content: {
    state: string[];
    turn: string;
  };
  onUpdate?: (newState: string[], newTurn: string) => void;
  onDelete?: () => void;
}

const TicTacToe = ({ content, onUpdate, onDelete }: TicTacToeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { state, turn } = content;

  const handleClick = (index: number) => {
    if (state[index] || !onUpdate) return;

    const newState = [...state];
    newState[index] = turn;
    const newTurn = turn === "X" ? "O" : "X";
    onUpdate(newState, newTurn);
  };

  return (
    <Card
      className="p-4 w-64 bg-secondary text-secondary-foreground shadow-lg transition-all duration-300 transform -rotate-2 hover:rotate-0 relative"
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
          <XIcon className="w-4 h-4" />
        </button>
      )}
      <h3 className="text-lg font-semibold mb-3 text-center">Tic-Tac-Toe</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {state.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className="aspect-square bg-background text-foreground border-2 border-border rounded-lg flex items-center justify-center text-2xl font-bold hover:bg-muted transition-colors"
            disabled={!!cell}
          >
            {cell}
          </button>
        ))}
      </div>
      <p className="text-center text-sm">Current turn: {turn}</p>
    </Card>
  );
};

export default TicTacToe;
