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
    <div className="mt-3 space-y-2">
      {/* Reactions Row */}
      {reactions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => toggleReaction(reaction.emoji)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors",
                reaction.users.includes(currentUserId || '')
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-background/50 text-foreground/70 border border-border hover:bg-background/80"
              )}
            >
              <span>{reaction.emoji}</span>
              <span className="text-xs font-medium">{reaction.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Votes Row */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleVote('up')}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            votes.user_vote === 'up'
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-background/50 text-foreground/70 border border-border hover:bg-background/80"
          )}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="font-medium">{votes.upvotes}</span>
        </button>
        
        <button
          onClick={() => toggleVote('down')}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            votes.user_vote === 'down'
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-background/50 text-foreground/70 border border-border hover:bg-background/80"
          )}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="font-medium">{votes.downvotes}</span>
        </button>
      </div>

      {/* Comments Section */}
      {totalComments > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>{totalComments} {totalComments === 1 ? 'comment' : 'comments'}</span>
          </div>
          
          <div className="space-y-1.5">
            {recentComments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-semibold text-foreground">
                  {comment.profiles?.username || 'User'}
                </span>
                <span className="text-muted-foreground">: </span>
                <span className="text-foreground/80">
                  {comment.comment_text.length > 80 ? `${comment.comment_text.slice(0, 80)}...` : comment.comment_text}
                </span>
              </div>
            ))}
          </div>
          
          {totalComments > 2 && (
            <button className="text-sm text-primary hover:underline">
              View all {totalComments} comments →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
