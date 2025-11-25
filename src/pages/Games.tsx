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
import {
  Plus,
  Gamepad2,
  Megaphone,
  Hand,
  Coins,
  Dices,
  Zap,
  Grid3x3,
  Circle,
  Castle,
  Bot,
  Users,
  Trophy,
  MessageCircleQuestion,
  Crown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notify } from "@/components/ui/custom-notification";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const WORD_BANK = [
  "javascript", "python", "computer", "programming", "developer",
  "algorithm", "database", "function", "variable", "interface",
  "elephant", "butterfly", "mountain", "ocean", "rainbow",
  "chocolate", "adventure", "mystery", "treasure", "galaxy"
];

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
  const [opponentType, setOpponentType] = useState<"friend" | "computer">("friend");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // New game specific state
  const [hangmanWord, setHangmanWord] = useState("");
  const [hangmanHint, setHangmanHint] = useState("");
  const [questionsSubject, setQuestionsSubject] = useState("");

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

  const isClassicGame = ["tic_tac_toe", "checkers", "connect_four", "chess"].includes(gameType);
  const needsCustomSetup = ["hangman", "twenty_one_questions"].includes(gameType);

  const handleCreateGame = async () => {
    if (!title.trim()) {
      notify("Please enter a game title");
      return;
    }

    // Validation for custom setup games
    if (gameType === "hangman" && opponentType === "friend" && !hangmanWord.trim()) {
      notify("Please enter a word for Hangman");
      return;
    }
    if (gameType === "twenty_one_questions" && !questionsSubject.trim()) {
      notify("Please enter what you're thinking of");
      return;
    }

    try {
      let metadata = {};

      // Set default metadata based on game type
      switch (gameType) {
        case "tic_tac_toe":
          if (opponentType === "computer") {
            metadata = {
              board: [[null, null, null], [null, null, null], [null, null, null]],
              nextTurnUserId: user?.id,
              isComputerOpponent: true,
              difficulty,
              playerSymbol: 'X',
              computerSymbol: 'O',
            };
          } else {
            metadata = {
              board: [[null, null, null], [null, null, null], [null, null, null]],
              nextTurnUserId: user?.id,
            };
          }
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
            blackPlayer: opponentType === "computer" ? "computer" : '',
            isComputerOpponent: opponentType === "computer",
            difficulty: opponentType === "computer" ? difficulty : undefined,
          };
          break;

        case "connect_four":
          metadata = {
            board: Array(6).fill(null).map(() => Array(7).fill(null)),
            currentTurn: 'red',
            redPlayer: user?.id,
            yellowPlayer: opponentType === "computer" ? "computer" : '',
            isComputerOpponent: opponentType === "computer",
            difficulty: opponentType === "computer" ? difficulty : undefined,
          };
          break;

        case "chess":
          metadata = {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Starting position
            currentTurn: 'white',
            whitePlayer: user?.id,
            blackPlayer: opponentType === "computer" ? "computer" : '',
            moveHistory: [],
            gameStatus: 'active',
            isComputerOpponent: opponentType === "computer",
            difficulty: opponentType === "computer" ? difficulty : undefined,
          };
          break;

        case "hangman":
          const word = opponentType === "computer"
            ? WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)].toUpperCase()
            : hangmanWord.trim().toUpperCase();
          metadata = {
            word,
            guessedLetters: [],
            maxGuesses: 6,
            incorrectGuesses: 0,
            currentTurn: user?.id,
            wordHint: hangmanHint || undefined,
            isComputerOpponent: opponentType === "computer",
          };
          break;

        case "twenty_one_questions":
          metadata = {
            subject: questionsSubject.trim(),
            currentQuestion: 0,
            maxQuestions: 21,
            questions: [],
            thinkerUserId: user?.id,
            guesserUserId: '', // Will be set when opponent joins
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

      const status = opponentType === "computer" ? "in_progress" : "waiting";

      await createGame(
        circleId!,
        gameType as any,
        title,
        description || undefined,
        metadata,
        status
      );

      notify(opponentType === "computer" ? "Game started vs Computer!" : "Game created!");

      // Reset form
      setTitle("");
      setDescription("");
      setGameType("tic_tac_toe");
      setOpponentType("friend");
      setDifficulty("medium");
      setHangmanWord("");
      setHangmanHint("");
      setQuestionsSubject("");
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById('instant-play')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Play
                </Button>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Game
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Game</DialogTitle>
                      <DialogDescription>
                        Choose a game type and opponent
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                      {/* Game Type Selection */}
                      <div className="space-y-3">
                        <Label>Choose Your Game</Label>
                        <Tabs defaultValue="classic" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="classic">Classic</TabsTrigger>
                            <TabsTrigger value="word">Word Games</TabsTrigger>
                            <TabsTrigger value="social">Social</TabsTrigger>
                          </TabsList>

                          <TabsContent value="classic" className="space-y-2 mt-4">
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setGameType("tic_tac_toe")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "tic_tac_toe"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <Grid3x3 className="w-8 h-8" />
                                <span className="font-medium text-sm">Tic Tac Toe</span>
                              </button>

                              <button
                                onClick={() => setGameType("checkers")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "checkers"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <Circle className="w-8 h-8" />
                                <span className="font-medium text-sm">Checkers</span>
                              </button>

                              <button
                                onClick={() => setGameType("connect_four")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "connect_four"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <Gamepad2 className="w-8 h-8" />
                                <span className="font-medium text-sm">Connect Four</span>
                              </button>

                              <button
                                onClick={() => setGameType("chess")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "chess"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <Castle className="w-8 h-8" />
                                <span className="font-medium text-sm">Chess</span>
                              </button>
                            </div>
                          </TabsContent>

                          <TabsContent value="word" className="space-y-2 mt-4">
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setGameType("hangman")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "hangman"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <MessageCircleQuestion className="w-8 h-8" />
                                <span className="font-medium text-sm">Hangman</span>
                              </button>

                              <button
                                onClick={() => setGameType("twenty_one_questions")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "twenty_one_questions"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <MessageCircleQuestion className="w-8 h-8" />
                                <span className="font-medium text-sm">21 Questions</span>
                              </button>
                            </div>
                          </TabsContent>

                          <TabsContent value="social" className="space-y-2 mt-4">
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setGameType("poll")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "poll"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <Megaphone className="w-8 h-8" />
                                <span className="font-medium text-sm">Poll</span>
                              </button>

                              <button
                                onClick={() => setGameType("would_you_rather")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "would_you_rather"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <Dices className="w-8 h-8" />
                                <span className="font-medium text-sm">Would You Rather</span>
                              </button>

                              <button
                                onClick={() => setGameType("question_of_the_day")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "question_of_the_day"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <MessageCircleQuestion className="w-8 h-8" />
                                <span className="font-medium text-sm">Question</span>
                              </button>

                              <button
                                onClick={() => setGameType("story_chain")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "story_chain"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <MessageCircleQuestion className="w-8 h-8" />
                                <span className="font-medium text-sm">Story Chain</span>
                              </button>

                              <button
                                onClick={() => setGameType("rate_this")}
                                className={cn(
                                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                                  gameType === "rate_this"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <Trophy className="w-8 h-8" />
                                <span className="font-medium text-sm">Rate This</span>
                              </button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Opponent Type - Only for classic games */}
                      {isClassicGame && (
                        <div className="space-y-3">
                          <Label>Choose Your Opponent</Label>
                          <RadioGroup value={opponentType} onValueChange={(v) => setOpponentType(v as any)}>
                            <div className="grid grid-cols-2 gap-3">
                              <label
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                  opponentType === "friend"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <RadioGroupItem value="friend" id="friend" />
                                <div className="flex items-center gap-2">
                                  <Users className="w-5 h-5" />
                                  <div>
                                    <div className="font-medium">Play with Friend</div>
                                    <div className="text-xs text-muted-foreground">Invite circle members</div>
                                  </div>
                                </div>
                              </label>

                              <label
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                  opponentType === "computer"
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <RadioGroupItem value="computer" id="computer" />
                                <div className="flex items-center gap-2">
                                  <Bot className="w-5 h-5" />
                                  <div>
                                    <div className="font-medium">Play vs AI</div>
                                    <div className="text-xs text-muted-foreground">Practice against computer</div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}

                      {/* Difficulty - Only for computer opponent */}
                      {isClassicGame && opponentType === "computer" && (
                        <div className="space-y-3">
                          <Label>AI Difficulty</Label>
                          <RadioGroup value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                            <div className="grid grid-cols-3 gap-3">
                              <label
                                className={cn(
                                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                  difficulty === "easy"
                                    ? "border-green-500 bg-green-500/10"
                                    : "border-border hover:border-green-500/50"
                                )}
                              >
                                <RadioGroupItem value="easy" id="easy" className="sr-only" />
                                <div className="font-medium">Easy</div>
                                <div className="text-xs text-muted-foreground text-center">Casual play</div>
                              </label>

                              <label
                                className={cn(
                                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                  difficulty === "medium"
                                    ? "border-yellow-500 bg-yellow-500/10"
                                    : "border-border hover:border-yellow-500/50"
                                )}
                              >
                                <RadioGroupItem value="medium" id="medium" className="sr-only" />
                                <div className="font-medium">Medium</div>
                                <div className="text-xs text-muted-foreground text-center">Balanced</div>
                              </label>

                              <label
                                className={cn(
                                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                                  difficulty === "hard"
                                    ? "border-red-500 bg-red-500/10"
                                    : "border-border hover:border-red-500/50"
                                )}
                              >
                                <RadioGroupItem value="hard" id="hard" className="sr-only" />
                                <div className="font-medium">Hard</div>
                                <div className="text-xs text-muted-foreground text-center">Challenging</div>
                              </label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}

                      {/* Game Details */}
                      <div className="space-y-4 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>Game Title</Label>
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
                            rows={2}
                          />
                        </div>

                        {/* Hangman specific fields */}
                        {gameType === "hangman" && opponentType === "friend" && (
                          <>
                            <div className="space-y-2">
                              <Label>Word to Guess</Label>
                              <Input
                                value={hangmanWord}
                                onChange={(e) => setHangmanWord(e.target.value)}
                                placeholder="Enter a word"
                                maxLength={20}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Hint (Optional)</Label>
                              <Input
                                value={hangmanHint}
                                onChange={(e) => setHangmanHint(e.target.value)}
                                placeholder="Give a helpful hint"
                              />
                            </div>
                          </>
                        )}

                        {/* 21 Questions specific field */}
                        {gameType === "twenty_one_questions" && (
                          <div className="space-y-2">
                            <Label>What are you thinking of?</Label>
                            <Input
                              value={questionsSubject}
                              onChange={(e) => setQuestionsSubject(e.target.value)}
                              placeholder="Enter what you're thinking of (keep it secret!)"
                            />
                            <p className="text-xs text-muted-foreground">
                              This will be hidden until someone guesses correctly or runs out of questions
                            </p>
                          </div>
                        )}
                      </div>

                      <Button onClick={handleCreateGame} className="w-full" size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        {opponentType === "computer" ? "Start Game vs AI" : "Create Game"}
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
              <div className="relative inline-block">
                <Gamepad2 className="w-20 h-20 mx-auto text-muted-foreground" />
                <Crown className="w-8 h-8 absolute -top-2 -right-2 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">No games yet</h2>
                <p className="text-muted-foreground mb-6">Start a new game with friends or challenge the AI</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setCreateDialogOpen(true)} size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Game
                </Button>
                <Button
                  onClick={() => {
                    setOpponentType("computer");
                    setCreateDialogOpen(true);
                  }}
                  size="lg"
                  variant="secondary"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Play vs AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Games Section */}
              {games.filter(g => g.status !== 'finished').length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Active Games</h2>
                    <span className="text-sm text-muted-foreground">
                      {games.filter(g => g.status !== 'finished').length} game{games.filter(g => g.status !== 'finished').length !== 1 ? 's' : ''}
                    </span>
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
