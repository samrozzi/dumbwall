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
import { Game, GameType } from "@/types/games";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Zap,
  Grid3x3,
  Circle,
  Castle,
  Gamepad2,
  MessageCircleQuestion,
  Megaphone,
  Dices,
  Trophy,
  Hand,
  Coins,
  Bot,
  Users,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { notify } from "@/components/ui/custom-notification";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Game catalog with metadata
type GameCategory = "quick" | "social" | "strategy" | "word" | "board";

interface GameDefinition {
  type: GameType;
  name: string;
  icon: any;
  description: string;
  categories: GameCategory[];
  supportsAI: boolean;
  isInstant?: boolean;
}

const GAME_CATALOG: GameDefinition[] = [
  {
    type: "tic_tac_toe",
    name: "Tic Tac Toe",
    icon: Grid3x3,
    description: "Classic 3x3 grid game",
    categories: ["quick", "strategy", "board"],
    supportsAI: true,
  },
  {
    type: "chess",
    name: "Chess",
    icon: Castle,
    description: "The ultimate strategy game",
    categories: ["strategy", "board"],
    supportsAI: true,
  },
  {
    type: "checkers",
    name: "Checkers",
    icon: Circle,
    description: "Jump and capture pieces",
    categories: ["strategy", "board"],
    supportsAI: true,
  },
  {
    type: "connect_four",
    name: "Connect Four",
    icon: Gamepad2,
    description: "Connect 4 in a row to win",
    categories: ["quick", "strategy", "board"],
    supportsAI: true,
  },
  {
    type: "hangman",
    name: "Hangman",
    icon: MessageCircleQuestion,
    description: "Guess the word letter by letter",
    categories: ["word"],
    supportsAI: true,
  },
  {
    type: "twenty_one_questions",
    name: "21 Questions",
    icon: MessageCircleQuestion,
    description: "Guess what I'm thinking",
    categories: ["word", "social"],
    supportsAI: false,
  },
  {
    type: "poll",
    name: "Poll",
    icon: Megaphone,
    description: "Ask your circle a question",
    categories: ["quick", "social"],
    supportsAI: false,
  },
  {
    type: "would_you_rather",
    name: "Would You Rather",
    icon: Dices,
    description: "Choose between two options",
    categories: ["quick", "social"],
    supportsAI: false,
  },
  {
    type: "question_of_the_day",
    name: "Question of the Day",
    icon: MessageCircleQuestion,
    description: "Daily conversation starter",
    categories: ["social"],
    supportsAI: false,
  },
  {
    type: "story_chain",
    name: "Story Chain",
    icon: MessageCircleQuestion,
    description: "Build a story together",
    categories: ["social", "word"],
    supportsAI: false,
  },
  {
    type: "rate_this",
    name: "Rate This",
    icon: Trophy,
    description: "Rate and compare opinions",
    categories: ["social"],
    supportsAI: false,
  },
];

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
  const [selectedCategory, setSelectedCategory] = useState<"all" | GameCategory>("all");
  const [selectedGameDef, setSelectedGameDef] = useState<GameDefinition | null>(null);

  // Instant play dialogs
  const [quickPollOpen, setQuickPollOpen] = useState(false);
  const [rpsOpen, setRpsOpen] = useState(false);
  const [coinFlipOpen, setCoinFlipOpen] = useState(false);
  const [randomQuestionOpen, setRandomQuestionOpen] = useState(false);

  const { listGames, createGame } = useGameAPI();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [opponentType, setOpponentType] = useState<"friend" | "computer">("friend");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
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

  const myActiveGames = games.filter(g => g.status !== 'finished' && g.status !== 'cancelled');

  const filteredGameCatalog = selectedCategory === "all"
    ? GAME_CATALOG
    : GAME_CATALOG.filter(g => g.categories.includes(selectedCategory));

  const popularGames = GAME_CATALOG.filter(g =>
    ["tic_tac_toe", "chess", "would_you_rather", "poll"].includes(g.type)
  );

  const handleGameSelect = (gameDef: GameDefinition) => {
    setSelectedGameDef(gameDef);
    setTitle(`${gameDef.name} Game`);
    setOpponentType(gameDef.supportsAI ? "friend" : "friend");
    setCreateDialogOpen(true);
  };

  const handleCreateGame = async () => {
    if (!selectedGameDef || !title.trim()) {
      notify("Please enter a game title");
      return;
    }

    const gameType = selectedGameDef.type;

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
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
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
            guesserUserId: '',
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
        gameType,
        title,
        description || undefined,
        metadata,
        status
      );

      notify(opponentType === "computer" ? "Game started vs Computer!" : "Game created!");

      // Reset form
      setTitle("");
      setDescription("");
      setOpponentType("friend");
      setDifficulty("medium");
      setHangmanWord("");
      setHangmanHint("");
      setQuestionsSubject("");
      setSelectedGameDef(null);
      setCreateDialogOpen(false);
      loadGames();
    } catch (error: any) {
      console.error("Error creating game:", error);
      notify(error?.message || "Error creating game. Please try again.");
    }
  };

  if (!user || !circleId) return null;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <Navigation circleId={circleId} />

      <div className={`${isMobile ? 'px-4' : 'pl-24 pr-8'} py-6 overflow-y-auto flex-1`}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Games</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById('instant-play')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Play
                </Button>
                <Button
                  size="sm"
                  onClick={() => document.getElementById('category-games')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Game
                </Button>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
              <TabsList className={cn("w-full justify-start", isMobile && "overflow-x-auto")}>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="quick">Quick</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="strategy">Strategy</TabsTrigger>
                <TabsTrigger value="word">Word</TabsTrigger>
                <TabsTrigger value="board">Board</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Game Invites */}
          <GameInvites />

          {/* Your Games Section */}
          {myActiveGames.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-1">Your Games</h2>
                <p className="text-sm text-muted-foreground">
                  {myActiveGames.length} active game{myActiveGames.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myActiveGames.map((game) => (
                  <GameCard key={game.id} game={game} userId={user.id} onDelete={loadGames} />
                ))}
              </div>
            </section>
          )}

          {/* Category Games Section */}
          <section id="category-games" className="scroll-mt-20">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-1">
                {selectedCategory === "all" ? "All Games" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Games`}
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose a game to play with friends or AI
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredGameCatalog.map((gameDef) => (
                <button
                  key={gameDef.type}
                  onClick={() => handleGameSelect(gameDef)}
                  className="group relative bg-card border-2 border-border hover:border-primary/50 rounded-xl p-6 transition-all hover:scale-105 hover:shadow-lg text-left"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <gameDef.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-sm mb-1">{gameDef.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {gameDef.description}
                      </p>
                    </div>
                  </div>
                  {gameDef.supportsAI && (
                    <div className="absolute top-2 right-2">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Popular Games Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-1">Popular Games</h2>
              <p className="text-sm text-muted-foreground">Quick access to favorites</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularGames.map((gameDef) => (
                <button
                  key={gameDef.type}
                  onClick={() => handleGameSelect(gameDef)}
                  className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 rounded-lg p-5 hover:scale-105 transition-transform"
                >
                  <gameDef.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-sm text-center">{gameDef.name}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Instant Play Section */}
          <section id="instant-play" className="scroll-mt-20">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold mb-1">Instant Play</h2>
              <p className="text-sm text-muted-foreground">Quick games with minimal setup</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setQuickPollOpen(true)}
                className="bg-purple-100 dark:bg-purple-950 border-2 border-purple-400 dark:border-purple-600 rounded-lg p-6 hover:scale-105 transition-transform"
              >
                <Megaphone className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="font-semibold text-sm">Quick Poll</p>
              </button>
              <button
                onClick={() => setRpsOpen(true)}
                className="bg-pink-100 dark:bg-pink-950 border-2 border-pink-400 dark:border-pink-600 rounded-lg p-6 hover:scale-105 transition-transform"
              >
                <Hand className="w-8 h-8 mx-auto mb-2 text-pink-600 dark:text-pink-400" />
                <p className="font-semibold text-sm">Rock Paper Scissors</p>
              </button>
              <button
                onClick={() => setCoinFlipOpen(true)}
                className="bg-amber-100 dark:bg-amber-950 border-2 border-amber-400 dark:border-amber-600 rounded-lg p-6 hover:scale-105 transition-transform"
              >
                <Coins className="w-8 h-8 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                <p className="font-semibold text-sm">Coin Flip</p>
              </button>
              <button
                onClick={() => setRandomQuestionOpen(true)}
                className="bg-cyan-100 dark:bg-cyan-950 border-2 border-cyan-400 dark:border-cyan-600 rounded-lg p-6 hover:scale-105 transition-transform"
              >
                <Dices className="w-8 h-8 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                <p className="font-semibold text-sm">Random Question</p>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Create Game Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create {selectedGameDef?.name || "New Game"}
            </DialogTitle>
            <DialogDescription>
              Set up your game and invite friends{selectedGameDef?.supportsAI ? " or play vs AI" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Opponent Type - Only for games that support AI */}
            {selectedGameDef?.supportsAI && (
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
            {selectedGameDef?.supportsAI && opponentType === "computer" && (
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
              {selectedGameDef?.type === "hangman" && opponentType === "friend" && (
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
              {selectedGameDef?.type === "twenty_one_questions" && (
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

      {/* Instant Play Dialogs */}
      <QuickPollDialog open={quickPollOpen} onOpenChange={setQuickPollOpen} circleId={circleId} />
      <RockPaperScissorsDialog open={rpsOpen} onOpenChange={setRpsOpen} circleId={circleId} />
      <CoinFlipDialog open={coinFlipOpen} onOpenChange={setCoinFlipOpen} circleId={circleId} />
      <RandomQuestionDialog open={randomQuestionOpen} onOpenChange={setRandomQuestionOpen} circleId={circleId} />
    </div>
  );
};

export default Games;
