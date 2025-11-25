import { StoryAvatar } from "./StoryAvatar";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Trophy, MessageCircle, Users, X, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AudioClip } from "@/components/wall/AudioClip";
import StickyNote from "@/components/wall/StickyNote";
import ImageCard from "@/components/wall/ImageCard";
import { QuickPoll } from "@/components/wall/QuickPoll";
import { MusicDrop } from "@/components/wall/MusicDrop";
import { DoodleCanvas } from "@/components/wall/DoodleCanvas";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { ActivityInteractions } from "./ActivityInteractions";
import { usePhotoInteractions } from "@/hooks/usePhotoInteractions";

interface ActivityCardProps {
  activity: {
    id: string;
    user_id: string;
    activity_type: string;
    reference_id: string | null;
    reference_type: string | null;
    metadata: any;
    created_at: string;
    circle_id: string;
    profiles?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    wall_items?: {
      id: string;
      type: string;
      content: any;
      created_by: string;
      x: number;
      y: number;
      z_index: number;
    };
  };
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{type: 'image' | 'doodle', content: any, itemId: string} | null>(null);
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const getActionText = () => {
    switch (activity.activity_type) {
      case "wall_post":
        const itemType = activity.metadata?.item_type || "item";
        return `posted a ${itemType.replace("_", " ")}`;
      case "game_win":
        return "won a game";
      case "status_change":
        return "updated status";
      case "thread_join":
        return "joined a thread";
      case "poll_create":
        return "created a poll";
      case "story_add":
        return "added to story";
      case "member_join":
        return "joined the circle";
      default:
        return "activity";
    }
  };

  const getIcon = () => {
    switch (activity.activity_type) {
      case "game_win":
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "thread_join":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "member_join":
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    // Check if wall item was deleted
    if (activity.reference_type === 'wall_item' && !activity.wall_items) {
      return (
        <div className="mt-2 relative">
          <div className="opacity-50 line-through decoration-2 decoration-red-500/50">
            <p className="text-sm text-foreground/70">{getActionText()}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 italic">
            This item was removed
          </p>
        </div>
      );
    }
    
    if (activity.reference_type !== 'wall_item' || !activity.wall_items) {
      return <p className="text-sm text-foreground/70">{getActionText()}</p>;
    }

    const wallItem = activity.wall_items;
    
    switch (wallItem.type) {
      case 'audio':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <AudioClip 
              content={wallItem.content} 
              fullWidth 
            />
          </div>
        );
        
      case 'note':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <StickyNote 
              content={wallItem.content}
              fullWidth
              hideAvatar
            />
          </div>
        );
        
      case 'image':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <div 
              onClick={() => setSelectedItem({type: 'image', content: wallItem.content, itemId: wallItem.id})}
              className="max-h-[280px] flex items-center justify-center bg-background/5 rounded-lg overflow-hidden cursor-pointer hover:bg-background/10 transition-colors"
            >
              <img 
                src={wallItem.content.url}
                alt={wallItem.content.caption || "Wall image"}
                className="max-h-[280px] w-auto object-contain"
              />
            </div>
            <ActivityInteractions 
              wallItemId={wallItem.id}
              currentUserId={currentUserId || undefined}
            />
          </div>
        );
        
      case 'poll':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <QuickPoll 
              content={wallItem.content}
              itemId={wallItem.id}
              currentUserId={currentUserId || undefined}
              fullWidth
            />
          </div>
        );
        
      case 'music':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <MusicDrop 
              content={wallItem.content}
              fullWidth
            />
          </div>
        );
        
      case 'doodle':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <div 
              onClick={() => setSelectedItem({type: 'doodle', content: wallItem.content, itemId: wallItem.id})}
              className="cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-200 dark:border-teal-800 rounded-lg p-4 flex items-center justify-center max-h-[280px]">
                <img 
                  src={wallItem.content.imageUrl}
                  alt="Doodle"
                  className="max-h-[240px] w-auto object-contain rounded"
                />
              </div>
            </div>
            <ActivityInteractions 
              wallItemId={wallItem.id}
              currentUserId={currentUserId || undefined}
            />
          </div>
        );
        
      default:
        return <p className="text-sm text-foreground/70">{getActionText()}</p>;
    }
  };

  return (
    <div className="relative bg-white/[0.02] backdrop-blur-[18px] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors max-w-2xl">
      <div className="flex gap-3">
        {/* Avatar */}
        <StoryAvatar
          src={activity.profiles?.avatar_url}
          alt={activity.profiles?.display_name || activity.profiles?.username || "User"}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {activity.profiles?.display_name || activity.profiles?.username || "User"}
            </span>
            {getIcon()}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Interactive Content */}
          {renderContent()}
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Full view dialog */}
      <FullViewDialog 
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        currentUserId={currentUserId}
        commentInput={commentInput}
        setCommentInput={setCommentInput}
      />
    </div>
  );
};

// Separate component for the full view dialog
const FullViewDialog = ({ 
  selectedItem, 
  onClose, 
  currentUserId,
  commentInput,
  setCommentInput 
}: {
  selectedItem: {type: 'image' | 'doodle', content: any, itemId: string} | null;
  onClose: () => void;
  currentUserId: string | null;
  commentInput: string;
  setCommentInput: (value: string) => void;
}) => {
  const { comments, reactions, votes, toggleReaction, toggleVote, addComment } = usePhotoInteractions(
    selectedItem?.itemId || '',
    currentUserId || undefined
  );

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    await addComment(commentInput);
    setCommentInput("");
  };

  if (!selectedItem) return null;

  return (
    <Dialog open={!!selectedItem} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 border-2 border-white/10 rounded-2xl [&>button]:hidden">
        <div className="flex h-full">
          {/* Left side - Image/Doodle */}
          <div className="flex-1 bg-black flex items-center justify-center p-8 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            {selectedItem.type === 'image' ? (
              <img 
                src={selectedItem.content.url}
                alt={selectedItem.content.caption || "Wall image"}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-200 dark:border-teal-800 rounded-lg p-6">
                <img 
                  src={selectedItem.content.imageUrl}
                  alt="Doodle"
                  className="max-h-[70vh] w-auto object-contain rounded"
                />
              </div>
            )}
          </div>
          
          {/* Right side - Interactions */}
          <div className="w-[400px] bg-card border-l border-border flex flex-col">
            {/* Reactions and votes */}
            <div className="p-4 border-b border-border space-y-3">
              {/* Quick reactions */}
              <div className="flex gap-2 flex-wrap">
                {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => {
                  const reaction = reactions.find(r => r.emoji === emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(emoji)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        reaction?.reacted_by_me
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                      }`}
                    >
                      {emoji} {reaction?.count || ''}
                    </button>
                  );
                })}
              </div>

              {/* Votes */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleVote('up')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    votes.user_vote === 'up'
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="font-semibold">{votes.upvotes}</span>
                </button>
                <button
                  onClick={() => toggleVote('down')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    votes.user_vote === 'down'
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span className="font-semibold">{votes.downvotes}</span>
                </button>
              </div>
            </div>

            {/* Comments */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="font-semibold text-sm">{comment.profiles?.username || 'Unknown'}</p>
                          <p className="text-sm mt-1">{comment.comment_text}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Comment input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendComment}
                  size="icon"
                  disabled={!commentInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
