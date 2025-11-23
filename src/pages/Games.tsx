import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { NotificationCenter } from "@/components/NotificationCenter";
import { GameWrapper } from "@/components/games/GameWrapper";
import { GameCard } from "@/components/games/GameCard";
import { GameInvites } from "@/components/games/GameInvites";
import { useGameAPI } from "@/hooks/useGameAPI";
import { Game } from "@/types/games";
import { Button } from "@/components/ui/button";
import { Plus, Gamepad2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/components/ui/custom-notification";
import { useIsMobile } from "@/hooks/use-mobile";

const Games = () => {
  const isMobile = useIsMobile();
  const { circleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { listGames, createGame } = useGameAPI();

  // Form state
  const [gameType, setGameType] = useState<string>("tic_tac_toe");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!circleId) return;
    loadGames();
  }, [user, circleId, navigate]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const data = await listGames(circleId);
      setGames(data.games);
    } catch (error) {
      console.error("Error loading games:", error);
      notify("Error loading games");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (!title.trim()) {
      notify("Please enter a game title");
      return;
    }

    try {
      let metadata = {};
      
      // Set default metadata based on game type
      switch (gameType) {
        case "tic_tac_toe":
          metadata = {
            board: [[null, null, null], [null, null, null], [null, null, null]],
            nextTurnUserId: user?.id,
          };
          break;
        case "checkers":
          const checkersBoard = Array(8).fill(null).map(() => Array(8).fill(null));
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
              if ((row + col) % 2 === 1) checkersBoard[row][col] = 'B';
            }
          }
          for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              if ((row + col) % 2 === 1) checkersBoard[row][col] = 'R';
            }
          }
          metadata = {
            board: checkersBoard,
            currentTurn: 'red',
            redPlayer: user?.id,
            blackPlayer: '',
          };
          break;
        case "connect_four":
          metadata = {
            board: Array(6).fill(null).map(() => Array(7).fill(null)),
            currentTurn: 'red',
            redPlayer: user?.id,
            yellowPlayer: '',
          };
          break;
        case "poll":
          metadata = {
            options: [
              { id: crypto.randomUUID(), label: "Option 1", voteCount: 0 },
              { id: crypto.randomUUID(), label: "Option 2", voteCount: 0 },
            ],
            allowMultiple: false,
          };
          break;
        case "would_you_rather":
          metadata = {
            optionA: { text: "Option A", votes: [] },
            optionB: { text: "Option B", votes: [] },
          };
          break;
        case "question_of_the_day":
          metadata = {
            question: title,
            responses: [],
          };
          break;
        case "story_chain":
          metadata = {
            storyParts: [],
            maxCharacters: 200,
          };
          break;
        case "rate_this":
          metadata = {
            subject: title,
            ratings: [],
            maxRating: 5,
          };
          break;
      }

      await createGame(
        circleId!,
        gameType as any,
        title,
        description || undefined,
        metadata,
        "waiting"
      );

      notify("Game created!");
      setTitle("");
      setDescription("");
      setGameType("poll");
      setCreateDialogOpen(false);
      loadGames();
    } catch (error) {
      console.error("Error creating game:", error);
      notify("Error creating game");
    }
  };

  if (!user || !circleId) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />
      
      <div className="px-4 sm:pl-24 sm:pr-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Game Invites */}
          <GameInvites />
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Games</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Game
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Game</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Game Type</Label>
                    <Select value={gameType} onValueChange={setGameType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Classic Games</div>
                        <SelectItem value="tic_tac_toe">Tic Tac Toe</SelectItem>
                        <SelectItem value="checkers">Checkers</SelectItem>
                        <SelectItem value="connect_four">Connect Four</SelectItem>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-2 pt-2">Social Games</div>
                        <SelectItem value="poll">Poll</SelectItem>
                        <SelectItem value="would_you_rather">Would You Rather</SelectItem>
                        <SelectItem value="question_of_the_day">Question of the Day</SelectItem>
                        <SelectItem value="story_chain">Story Chain</SelectItem>
                        <SelectItem value="rate_this">Rate This</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter game title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description"
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleCreateGame} className="w-full">
                    Create Game
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Games Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-20">
              <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No games yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first game to get started!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Game
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} userId={user.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Games;
