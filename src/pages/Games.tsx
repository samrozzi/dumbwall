import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { CircleHeader } from "@/components/CircleHeader";
import { GameCard } from "@/components/games/GameCard";
import { GameInvites } from "@/components/games/GameInvites";
import { QuickPollDialog } from "@/components/games/InstantPlay/QuickPollDialog";
import { RockPaperScissorsDialog } from "@/components/games/InstantPlay/RockPaperScissorsDialog";
import { CoinFlipDialog } from "@/components/games/InstantPlay/CoinFlipDialog";
import { RandomQuestionDialog } from "@/components/games/InstantPlay/RandomQuestionDialog";
import { useGameAPI } from "@/hooks/useGameAPI";
import { Game } from "@/types/games";
import { Button } from "@/components/ui/button";
import { Plus, Gamepad2, Megaphone, Hand, Coins, Dices, Zap } from "lucide-react";
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
  const [quickPollOpen, setQuickPollOpen] = useState(false);
  const [rpsOpen, setRpsOpen] = useState(false);
  const [coinFlipOpen, setCoinFlipOpen] = useState(false);
  const [randomQuestionOpen, setRandomQuestionOpen] = useState(false);
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
          <CircleHeader
            circleId={circleId}
            pageTitle="Games"
            actions={
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => document.getElementById('instant-play')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Play
                </Button>
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
            }
          />

          {/* Game Invites */}
          <GameInvites />

          {/* Games Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-semibold mb-2">No games yet</h2>
                <p className="text-muted-foreground mb-6">Start something new for your circle.</p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create your first game
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Games Section */}
              {games.filter(g => g.status !== 'finished').length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Active Games</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games
                      .filter(g => g.status !== 'finished')
                      .map((game) => (
                        <GameCard key={game.id} game={game} userId={user.id} />
                      ))}
                  </div>
                </section>
              )}

              {/* Instant Play Section */}
              <section id="instant-play" className="scroll-mt-20">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-1">Instant Play</h2>
                  <p className="text-sm text-muted-foreground">Quick games with minimal setup</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setQuickPollOpen(true)}
                    className="bg-purple-100 dark:bg-purple-950 border-2 border-purple-400 dark:border-purple-600 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Megaphone className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                    <p className="font-semibold text-sm">Quick Poll</p>
                  </button>
                  <button
                    onClick={() => setRpsOpen(true)}
                    className="bg-pink-100 dark:bg-pink-950 border-2 border-pink-400 dark:border-pink-600 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Hand className="w-8 h-8 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
                    <p className="font-semibold text-sm">Rock Paper Scissors</p>
                  </button>
                  <button
                    onClick={() => setCoinFlipOpen(true)}
                    className="bg-amber-100 dark:bg-amber-950 border-2 border-amber-400 dark:border-amber-600 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Coins className="w-8 h-8 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                    <p className="font-semibold text-sm">Coin Flip</p>
                  </button>
                  <button
                    onClick={() => setRandomQuestionOpen(true)}
                    className="bg-cyan-100 dark:bg-cyan-950 border-2 border-cyan-400 dark:border-cyan-600 rounded-lg p-6 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Dices className="w-8 h-8 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                    <p className="font-semibold text-sm">Random Question</p>
                  </button>
                </div>
              </section>

              {/* Finished Games Section */}
              {games.filter(g => g.status === 'finished').length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Recent Games</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games
                      .filter(g => g.status === 'finished')
                      .slice(0, 6)
                      .map((game) => (
                        <GameCard key={game.id} game={game} userId={user.id} />
                      ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instant Play Dialogs */}
      <QuickPollDialog open={quickPollOpen} onOpenChange={setQuickPollOpen} circleId={circleId} />
      <RockPaperScissorsDialog open={rpsOpen} onOpenChange={setRpsOpen} circleId={circleId} />
      <CoinFlipDialog open={coinFlipOpen} onOpenChange={setCoinFlipOpen} circleId={circleId} />
      <RandomQuestionDialog open={randomQuestionOpen} onOpenChange={setRandomQuestionOpen} circleId={circleId} />
    </div>
  );
};

export default Games;
