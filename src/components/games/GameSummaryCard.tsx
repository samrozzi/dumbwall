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
  const icons: Record<string, { emoji: string; color: string }> = {
    tic_tac_toe: { emoji: "⭕", color: "from-blue-500/20 to-cyan-500/20" },
    chess: { emoji: "♟️", color: "from-purple-500/20 to-indigo-500/20" },
    checkers: { emoji: "🔴", color: "from-red-500/20 to-orange-500/20" },
    connect_four: { emoji: "🔵", color: "from-blue-500/20 to-indigo-500/20" },
    hangman: { emoji: "🎯", color: "from-green-500/20 to-emerald-500/20" },
    twenty_one_questions: { emoji: "❓", color: "from-yellow-500/20 to-amber-500/20" },
    poll: { emoji: "📊", color: "from-teal-500/20 to-cyan-500/20" },
    would_you_rather: { emoji: "🤔", color: "from-pink-500/20 to-rose-500/20" },
    question_of_the_day: { emoji: "💭", color: "from-violet-500/20 to-purple-500/20" },
    story_chain: { emoji: "📖", color: "from-orange-500/20 to-amber-500/20" },
    rate_this: { emoji: "⭐", color: "from-yellow-500/20 to-orange-500/20" },
  };
  return icons[type] || { emoji: "🎮", color: "from-gray-500/20 to-slate-500/20" };
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
  if (game.status === "waiting") {
    return "Waiting for opponent";
  }

  return "vs Opponent";
};

export const GameSummaryCard = ({ game, userId, circleId }: GameSummaryCardProps) => {
  const navigate = useNavigate();
  const statusInfo = getStatusInfo(game, userId);
  const opponentInfo = getOpponentInfo(game, userId);
  const gameIcon = getGameIcon(game.type);

  const handleClick = () => {
    navigate(`/circle/${circleId}/games/${game.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-200 h-[140px]",
        "border-2 hover:border-primary/50 overflow-hidden",
        game.status === "in_progress" && statusInfo.label === "Your turn" && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="p-4 h-full flex flex-col justify-between">
        {/* Header with circular icon */}
        <div className="flex items-start gap-3">
          {/* Circular gradient icon */}
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br backdrop-blur-sm border-2 border-primary/20",
            gameIcon.color
          )}>
            <span className="text-2xl">{gameIcon.emoji}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1 mb-0.5">
              {game.title || getGameTypeName(game.type)}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{opponentInfo}</p>
          </div>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>

        {/* Footer with status and time */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={statusInfo.variant} className="text-xs whitespace-nowrap">
            {statusInfo.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};