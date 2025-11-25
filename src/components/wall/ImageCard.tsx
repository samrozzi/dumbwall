import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ArrowUp, ArrowDown, Send } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreatorBadge } from "@/components/CreatorBadge";
import { CardPersonality } from "@/components/wall/CardPersonality";
import { cn } from "@/lib/utils";
import { usePhotoInteractions } from "@/hooks/usePhotoInteractions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickReactions } from "@/components/chat/QuickReactions";

interface ImageCardProps {
  id: string;
  content: {
    url: string;
    caption?: string;
  };
  onDelete?: () => void;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
  hideAvatar?: boolean;
  fullWidth?: boolean;
  currentUserId?: string;
}

const ImageCard = ({ 
  id,
  content, 
  onDelete, 
  creatorAvatar, 
  creatorUsername, 
  hideAvatar, 
  fullWidth,
  currentUserId 
}: ImageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  
  const {
    comments,
    reactions,
    votes,
    loading,
    addComment,
    toggleReaction,
    toggleVote,
  } = usePhotoInteractions(id, currentUserId);

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentText);
    setCommentText("");
  };

  return (
    <CardPersonality type="image" className={fullWidth ? "w-full" : "w-64"}>
      <Card
        className={cn(
          "group relative bg-card shadow-lg transition-all duration-300 cursor-move hover:shadow-2xl hover:scale-105 overflow-visible rounded-3xl",
          fullWidth ? "w-full max-w-full" : "w-64"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {!hideAvatar && <CreatorBadge avatarUrl={creatorAvatar} username={creatorUsername} className="absolute top-2 left-2 z-10" />}
      
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full w-8 h-8 shadow-md hover:scale-110 transition-all z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div 
        onMouseDown={(e) => {
          setDragStartPos({ x: e.clientX, y: e.clientY });
          setWasDragged(false);
        }}
        onMouseMove={(e) => {
          const distMoved = Math.sqrt(
            Math.pow(e.clientX - dragStartPos.x, 2) + 
            Math.pow(e.clientY - dragStartPos.y, 2)
          );
          if (distMoved > 5) {
            setWasDragged(true);
          }
        }}
        onMouseUp={() => {
          if (!wasDragged) {
            setIsOpen(true);
          }
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          setDragStartPos({ x: touch.clientX, y: touch.clientY });
          setWasDragged(false);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const distMoved = Math.sqrt(
            Math.pow(touch.clientX - dragStartPos.x, 2) + 
            Math.pow(touch.clientY - dragStartPos.y, 2)
          );
          if (distMoved > 5) {
            setWasDragged(true);
          }
        }}
        onTouchEnd={() => {
          if (!wasDragged) {
            setIsOpen(true);
          }
        }}
        className="cursor-pointer overflow-hidden rounded-3xl bg-transparent"
      >
        <img
          src={content.url}
          alt={content.caption || "Wall image"}
          className="w-full h-full object-cover block"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
      {content.caption && (
        <p className="mt-2 text-sm text-neutral-100 break-words px-3 pb-3">{content.caption}</p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 border-2 border-white/10 rounded-2xl overflow-hidden [&>button]:hidden">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Instagram-style layout */}
          <div className="relative overflow-hidden h-[90vh] flex flex-col md:flex-row">
            
            {/* Left: Image & Caption Section */}
            <div className="bg-black md:w-[60%] flex flex-col">
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src={content.url}
                  alt={content.caption || "Wall image"}
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
              {/* Reactions & Votes - Fixed height */}
              <div className="p-4 space-y-3 flex-shrink-0 border-b">
                {/* Reactions Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => toggleReaction(reaction.emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors",
                        reaction.reacted_by_me
                          ? "bg-primary/10 border-primary"
                          : "bg-muted border-border hover:bg-accent"
                      )}
                    >
                      <span>{reaction.emoji}</span>
                      {reaction.count > 0 && (
                        <span className="text-xs font-medium">{reaction.count}</span>
                      )}
                    </button>
                  ))}
                  <QuickReactions
                    onReactionClick={toggleReaction}
                    onMoreClick={() => {}}
                    className="scale-90"
                  />
                </div>

                {/* Vote Section */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleVote('up')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-lg transition-colors",
                      votes.user_vote === 'up'
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "hover:bg-accent"
                    )}
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="font-semibold">{votes.upvotes}</span>
                  </button>
                  <button
                    onClick={() => toggleVote('down')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-lg transition-colors",
                      votes.user_vote === 'down'
                        ? "bg-red-500/20 text-red-600 dark:text-red-400"
                        : "hover:bg-accent"
                    )}
                  >
                    <ArrowDown className="h-4 w-4" />
                    <span className="font-semibold">{votes.downvotes}</span>
                  </button>
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this image from the wall.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onDelete?.();
              setShowDeleteConfirm(false);
            }}>
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
    </CardPersonality>
  );
};

export default ImageCard;
