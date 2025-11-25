import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/types/games";
import { GameWrapper } from "./GameWrapper";
import { UserPlus, Trash2, Play, Users, Clock } from "lucide-react";
import { useState } from "react";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useGameAPI } from "@/hooks/useGameAPI";
import { notify } from "@/components/ui/custom-notification";

interface GameCardProps {
  game: Game;
  userId: string;
  onDelete?: () => void;
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

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; label: string }> = {
    waiting: { variant: "secondary", label: "Waiting" },
    in_progress: { variant: "default", label: "Active" },
    finished: { variant: "outline", label: "Finished" },
    cancelled: { variant: "destructive", label: "Cancelled" },
  };
  const config = variants[status] || variants.waiting;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const GameCard = ({ game, userId, onDelete }: GameCardProps) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { gameAction } = useGameAPI();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this game?")) return;
    
    setIsDeleting(true);
    try {
      // Use "forfeit" event type which is valid, and set status to "cancelled"
      await gameAction(game.id, "forfeit", {}, "cancelled");
      notify("Game deleted!");
      onDelete?.();
    } catch (error) {
      console.error("Error deleting game:", error);
      notify("Failed to delete game");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card 
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.02] border-2",
          game.status === "in_progress" && "border-primary/50 shadow-primary/10",
          game.status === "finished" && "opacity-75"
        )}
      >
        {/* Header bar with game info */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getGameIcon(game.type)}</span>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">
                {game.title || getGameTypeName(game.type)}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(game.status)}
          </div>
        </div>

        {/* Action buttons - shown on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
          {game.status !== "finished" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setShowInviteDialog(true);
              }}
              className="h-8 shadow-lg"
            >
              <UserPlus className="w-3 h-3" />
            </Button>
          )}
          {game.created_by === userId && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 shadow-lg"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Game content */}
        <div className="p-4">
          <GameWrapper gameId={game.id} userId={userId} />
        </div>
      </Card>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        gameId={game.id}
        circleId={game.circle_id}
      />
    </>
  );
};
