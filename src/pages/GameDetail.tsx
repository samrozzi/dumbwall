import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { GameWrapper } from "@/components/games/GameWrapper";
import { InviteMemberDialog } from "@/components/games/InviteMemberDialog";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useGameAPI } from "@/hooks/useGameAPI";
import { Game } from "@/types/games";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Trash2, Users } from "lucide-react";
import { notify } from "@/components/ui/custom-notification";
import { useIsMobile } from "@/hooks/use-mobile";

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

const GameDetail = () => {
  const isMobile = useIsMobile();
  const { circleId, gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { getGame, gameAction } = useGameAPI();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!circleId || !gameId) return;
    loadGame();
  }, [user, circleId, gameId, navigate]);

  const loadGame = async () => {
    try {
      setLoading(true);
      const data = await getGame(gameId!);
      setGame(data.game);
    } catch (error) {
      console.error("Error loading game:", error);
      notify("Error loading game");
      navigate(`/circle/${circleId}/games`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!game) return;

    setIsDeleting(true);
    try {
      await gameAction(game.id, "forfeit", {}, "cancelled");
      notify("Game deleted!");
      navigate(`/circle/${circleId}/games`);
    } catch (error) {
      console.error("Error deleting game:", error);
      notify("Failed to delete game");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    navigate(`/circle/${circleId}/games`);
  };

  if (!user || !circleId || !gameId) return null;

  if (loading) {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-background">
        <Navigation circleId={circleId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading game...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-background">
        <Navigation circleId={circleId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Game not found</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <Navigation circleId={circleId} />

      <div className={`${isMobile ? 'px-4 pb-24' : 'pl-24 pr-8'} py-6 overflow-y-auto flex-1`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {game.title || getGameTypeName(game.type)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getGameTypeName(game.type)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              {getStatusBadge(game.status)}
            </div>
          </div>

          {/* Action buttons */}
          {game.status === "waiting" && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowInviteDialog(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Player
              </Button>
              {game.created_by === user.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Game
                </Button>
              )}
            </div>
          )}

          {/* Forfeit button for active games */}
          {game.status === "in_progress" && game.created_by === user.id && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Forfeit Game
              </Button>
            </div>
          )}

          {/* Game content */}
          <GameWrapper gameId={game.id} userId={user.id} />
        </div>
      </div>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        gameId={game.id}
        circleId={game.circle_id}
      />
    </div>
  );
};

export default GameDetail;
