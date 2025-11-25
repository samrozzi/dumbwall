import { usePhotoInteractions } from "@/hooks/usePhotoInteractions";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityInteractionsProps {
  wallItemId: string;
  currentUserId?: string;
}

export const ActivityInteractions = ({ wallItemId, currentUserId }: ActivityInteractionsProps) => {
  const { reactions, votes, comments, toggleReaction, toggleVote } = usePhotoInteractions(wallItemId, currentUserId);

  const totalComments = comments.length;
  const recentComments = comments.slice(0, 2);

  return (
    <div className="mt-2">
      {/* Single Row: Reactions + Votes + Comments */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Reactions */}
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => toggleReaction(reaction.emoji)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
              reaction.users.includes(currentUserId || '')
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-background/50 text-foreground/70 border border-border hover:bg-background/80"
            )}
          >
            <span className="text-sm">{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </button>
        ))}

        {/* Upvote */}
        <button
          onClick={() => toggleVote('up')}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
            votes.user_vote === 'up'
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-background/50 text-foreground/70 border border-border hover:bg-background/80"
          )}
        >
          <ThumbsUp className="w-3 h-3" />
          <span className="font-medium">{votes.upvotes}</span>
        </button>
        
        {/* Downvote */}
        <button
          onClick={() => toggleVote('down')}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
            votes.user_vote === 'down'
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-background/50 text-foreground/70 border border-border hover:bg-background/80"
          )}
        >
          <ThumbsDown className="w-3 h-3" />
          <span className="font-medium">{votes.downvotes}</span>
        </button>

        {/* Comments count */}
        {totalComments > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-background/50 border border-border text-foreground/70">
            <MessageCircle className="w-3 h-3" />
            <span className="font-medium">{totalComments}</span>
          </div>
        )}
      </div>
    </div>
  );
};
