import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/types/games";
import { useNavigate } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface GameSummaryCardProps {
  game: Game;
  userId: string;
  circleId: string;
}

const getGameIcon = (type: string) => {
  const icons: Record<string, string> = {
    tic_tac_toe: "⭕",
    chess: "♟️",
    checkers: "🔴",
    connect_four: "🔵",
    hangman: "🎯",
    twenty_one_questions: "❓",
    poll: "📊",
    would_you_rather: "🤔",
    question_of_the_day: "💭",
    story_chain: "📖",
    rate_this: "⭐",
  };
  return icons[type] || "🎮";
};

const getGameTypeName = (type: string) => {
  const names: Record<string, string> = {
    tic_tac_toe: "Tic Tac Toe",
    chess: "Chess",
    checkers: "Checkers",
    connect_four: "Connect Four",
    hangman: "Hangman",
    twenty_one_questions: "21 Questions",
    poll: "Poll",
    would_you_rather: "Would You Rather",
    question_of_the_day: "Question of the Day",
    story_chain: "Story Chain",
    rate_this: "Rate This",
  };
  return names[type] || type;
};

const getStatusInfo = (game: Game, userId: string) => {
  if (game.status === "finished") {
    return { label: "Finished", variant: "outline" as const, color: "text-muted-foreground" };
  }
  if (game.status === "cancelled") {
    return { label: "Cancelled", variant: "destructive" as const, color: "text-destructive" };
  }
  if (game.status === "waiting") {
    return { label: "Waiting for players", variant: "secondary" as const, color: "text-muted-foreground" };
  }

  // Check if it's user's turn for turn-based games
  const metadata = game.metadata as any;
  if (metadata.nextTurnUserId === userId) {
    return { label: "Your turn", variant: "default" as const, color: "text-primary font-semibold" };
  }
  if (metadata.currentTurn || metadata.nextTurnUserId) {
    return { label: "Waiting", variant: "secondary" as const, color: "text-muted-foreground" };
  }

  return { label: "Active", variant: "default" as const, color: "text-muted-foreground" };
};

const getOpponentInfo = (game: Game, userId: string) => {
  const metadata = game.metadata as any;

  // Check for computer opponent
  if (metadata.isComputerOpponent) {
    return "vs AI";
  }

  // For now, show generic opponent text
  // In a full implementation, you'd query game_participants to get actual usernames
  if (game.status === "waiting") {
    return "Waiting for opponent";
  }

  return "vs Opponent";
};

export const GameSummaryCard = ({ game, userId, circleId }: GameSummaryCardProps) => {
  const navigate = useNavigate();
  const statusInfo = getStatusInfo(game, userId);
  const opponentInfo = getOpponentInfo(game, userId);

  const handleClick = () => {
    navigate(`/circle/${circleId}/games/${game.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-200",
        "border-2 hover:border-primary/50",
        game.status === "in_progress" && statusInfo.label === "Your turn" && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="p-4 space-y-3">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">{getGameIcon(game.type)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1 mb-1">
              {game.title || getGameTypeName(game.type)}
            </h3>
            <p className="text-xs text-muted-foreground">{opponentInfo}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge variant={statusInfo.variant} className="text-xs">
            {statusInfo.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
          </div>
        </div>

        {/* Tiny preview for certain games (optional) */}
        {game.type === "tic_tac_toe" && game.metadata.board && (
          <div className="grid grid-cols-3 gap-0.5 w-16 h-16 mx-auto opacity-60">
            {(game.metadata.board as any[][]).map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className="bg-muted/50 border border-border flex items-center justify-center text-xs"
                >
                  {cell}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
