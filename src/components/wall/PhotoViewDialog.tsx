import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Send } from "lucide-react";
import { usePhotoInteractions } from "@/hooks/usePhotoInteractions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PhotoViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  wallItemId: string;
  content: {
    url?: string;
    imageUrl?: string;
    caption?: string;
  };
  type: 'image' | 'doodle';
  currentUserId?: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

export const PhotoViewDialog = ({
  isOpen,
  onClose,
  wallItemId,
  content,
  type,
  currentUserId,
}: PhotoViewDialogProps) => {
  const [commentText, setCommentText] = useState("");
  
  const {
    comments,
    reactions,
    loading,
    addComment,
    toggleReaction,
  } = usePhotoInteractions(wallItemId, currentUserId);

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentText);
    setCommentText("");
  };

  const imageUrl = content.url || content.imageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 border-2 border-white/10 rounded-2xl overflow-hidden">
        {/* Close button - top right of dialog */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Layout */}
        <div className="relative overflow-hidden h-[90vh] flex flex-col md:flex-row">
          
          {/* Left: Image/Doodle & Caption Section */}
          <div className={cn(
            "md:w-[60%] flex flex-col",
            type === 'doodle' 
              ? "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20" 
              : "bg-black"
          )}>
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
              <img
                src={imageUrl}
                alt={content.caption || type === 'doodle' ? 'Doodle' : 'Photo'}
                className="max-w-full max-h-full object-contain"
                draggable="false"
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
            {content.caption && (
              <div className="bg-muted p-4 border-t border-border flex-shrink-0">
                <p className="text-foreground font-semibold">{content.caption}</p>
              </div>
            )}
          </div>

          {/* Right: Interactions & Comments Section */}
          <div className="bg-background md:w-[40%] border-l border-border flex flex-col">
            {/* Reactions - Fixed height */}
            <div className="p-4 flex-shrink-0 border-b">
              <div className="flex items-center gap-2 flex-wrap">
                {QUICK_EMOJIS.map((emoji) => {
                  const reaction = reactions.find(r => r.emoji === emoji);
                  const count = reaction?.count || 0;
                  const reactedByMe = reaction?.reacted_by_me || false;
                  
                  return (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors",
                        reactedByMe
                          ? "bg-primary/10 border-primary"
                          : "bg-muted border-border hover:bg-accent"
                      )}
                    >
                      <span className="text-base">{emoji}</span>
                      {count > 0 && (
                        <span className="text-xs font-medium">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments - Scrollable fills space */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 pb-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  💬 Comments ({comments.length})
                </h4>
              </div>
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-3 pb-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium">
                              {comment.profiles?.username || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">
                            {comment.comment_text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Comment Input - Sticky at bottom */}
            <div className="sticky bottom-0 bg-background border-t p-4 flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <Button
                onClick={handleSendComment}
                size="icon"
                disabled={!commentText.trim()}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};
