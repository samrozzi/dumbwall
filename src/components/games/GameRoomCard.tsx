import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Game, GameParticipant, TicTacToeMetadata, CheckersMetadata, ConnectFourMetadata, PollMetadata, WouldYouRatherMetadata } from "@/types/games";
import { Gamepad2, MessageSquare, HelpCircle, Link2, Star, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GameRoomCardProps {
  game: Game;
  userId: string;
  participants: GameParticipant[];
  onClick: () => void;
}

const gameTypeColors = {
  tic_tac_toe: "bg-amber-100 border-amber-400 dark:bg-amber-950 dark:border-amber-600",
  checkers: "bg-red-100 border-red-400 dark:bg-red-950 dark:border-red-600",
  connect_four: "bg-blue-100 border-blue-400 dark:bg-blue-950 dark:border-blue-600",
  poll: "bg-purple-100 border-purple-400 dark:bg-purple-950 dark:border-purple-600",
  would_you_rather: "bg-pink-100 border-pink-400 dark:bg-pink-950 dark:border-pink-600",
  question_of_the_day: "bg-cyan-100 border-cyan-400 dark:bg-cyan-950 dark:border-cyan-600",
  story_chain: "bg-green-100 border-green-400 dark:bg-green-950 dark:border-green-600",
  rate_this: "bg-orange-100 border-orange-400 dark:bg-orange-950 dark:border-orange-600",
};

const gameTypeIcons = {
  tic_tac_toe: Gamepad2,
  checkers: Gamepad2,
  connect_four: Gamepad2,
  poll: Megaphone,
  would_you_rather: HelpCircle,
  question_of_the_day: MessageSquare,
  story_chain: Link2,
  rate_this: Star,
};

const gameTypeLabels = {
  tic_tac_toe: "Tic Tac Toe",
  checkers: "Checkers",
  connect_four: "Connect Four",
  poll: "Poll",
  would_you_rather: "Would You Rather",
  question_of_the_day: "Question",
  story_chain: "Story Chain",
  rate_this: "Rate This",
};

export const GameRoomCard = ({ game, userId, participants, onClick }: GameRoomCardProps) => {
  const getTurnStatus = () => {
    if (game.status === 'finished') {
      return { text: 'Finished', highlight: false, cta: 'View Results' };
    }

    switch (game.type) {
      case 'tic_tac_toe':
      case 'checkers':
      case 'connect_four': {
        const metadata = game.metadata as TicTacToeMetadata | CheckersMetadata | ConnectFourMetadata;
        const nextUserId = 'nextTurnUserId' in metadata ? metadata.nextTurnUserId : null;
        
        if (nextUserId === userId) {
          return { text: 'Your turn', highlight: true, cta: 'Play' };
        } else if (nextUserId) {
          const nextPlayer = participants.find(p => p.user_id === nextUserId);
          const name = nextPlayer?.profiles.display_name || nextPlayer?.profiles.username || 'Opponent';
          return { text: `${name}'s turn`, highlight: false, cta: 'Watch' };
        }
        return { text: 'In Progress', highlight: false, cta: 'View' };
      }

      case 'poll':
      case 'would_you_rather':
        return { text: 'Voting open', highlight: true, cta: 'Vote' };

      case 'question_of_the_day':
      case 'story_chain':
      case 'rate_this':
        return { text: 'Your turn', highlight: true, cta: 'Respond' };

      default:
        return { text: 'In Progress', highlight: false, cta: 'View' };
    }
  };

  const renderMiniPreview = () => {
    if (game.type === 'tic_tac_toe') {
      const metadata = game.metadata as TicTacToeMetadata;
      return (
        <div className="w-16 h-16 grid grid-cols-3 gap-0.5 bg-border p-1 rounded">
          {metadata.board.flat().map((cell, i) => (
            <div key={i} className="bg-background flex items-center justify-center text-xs font-bold">
              {cell || ''}
            </div>
          ))}
        </div>
      );
    }

    const Icon = gameTypeIcons[game.type];
    return <Icon className="w-12 h-12 text-muted-foreground" />;
  };

  const status = getTurnStatus();
  const colorClass = gameTypeColors[game.type] || "bg-card";
  const Icon = gameTypeIcons[game.type];

  return (
    <Card 
      className={`${colorClass} border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer ${
        status.highlight ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Top row - Title and Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-1 flex-1">
            {game.title || `${gameTypeLabels[game.type]}`}
          </h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            <Icon className="w-3 h-3 mr-1" />
            {gameTypeLabels[game.type]}
          </Badge>
        </div>

        {/* Middle row - Preview and Players */}
        <div className="flex items-center gap-4">
          {/* Mini preview */}
          <div className="shrink-0">
            {renderMiniPreview()}
          </div>

          {/* Players and turn info */}
          <div className="flex-1 space-y-2">
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map(p => (
                <Avatar key={p.user_id} className="w-8 h-8 border-2 border-background">
                  <AvatarImage src={p.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(p.profiles.display_name || p.profiles.username).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{participants.length - 3}
                </div>
              )}
            </div>

            {/* Turn status */}
            <div className="space-y-1">
              <p className={`text-sm font-medium ${status.highlight ? 'text-primary' : 'text-muted-foreground'}`}>
                {status.text}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom row - Status and CTA */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={game.status === 'finished' ? 'outline' : 'default'} className="text-xs">
            {game.status === 'finished' ? 'Completed' : game.status === 'waiting' ? 'New' : 'In Progress'}
          </Badge>
          <Button 
            size="sm" 
            variant={status.highlight ? 'default' : 'secondary'}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {status.cta}
          </Button>
        </div>
      </div>
    </Card>
  );
};
