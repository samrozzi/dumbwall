import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickReactions } from "./QuickReactions";
import { EmojiPicker } from "./EmojiPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLongPress } from "@/hooks/useLongPress";
import { useReactions } from "@/hooks/useReactions";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatMessageProps {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  reply_to_id?: string | null;
  replied_message?: {
    body: string;
    sender_name: string;
  } | null;
  currentUserId?: string;
  isOwn: boolean;
  onReply: () => void;
}

export function ChatMessage({
  id,
  body,
  created_at,
  sender_name,
  sender_avatar,
  replied_message,
  currentUserId,
  isOwn,
  onReply,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { reactions, toggleReaction } = useReactions(id, currentUserId);

  const longPressProps = useLongPress({
    onLongPress: () => {
      if (isMobile) {
        setShowActions(true);
      }
    },
    ms: 300,
  });

  const handleReactionClick = (emoji: string) => {
    toggleReaction(emoji);
    setShowActions(false);
  };

  const handleMoreEmojis = () => {
    setShowActions(false);
    setShowEmojiPicker(true);
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "group relative flex gap-3 py-2 px-3 hover:bg-accent/30 transition-colors",
        isOwn && "flex-row-reverse"
      )}
      onMouseEnter={() => !isMobile && setShowActions(true)}
      onMouseLeave={() => !isMobile && setShowActions(false)}
      {...(isMobile ? longPressProps : {})}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={sender_avatar} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {sender_name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 min-w-0", isOwn && "flex flex-col items-end")}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{sender_name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {replied_message && (
          <div className="mb-2 pl-3 border-l-2 border-muted-foreground/30 ml-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CornerDownRight className="h-3 w-3" />
              <span className="font-medium">{replied_message.sender_name}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {replied_message.body}
            </div>
          </div>
        )}

        <div
          className={cn(
            "inline-block px-3 py-2 rounded-lg max-w-[80%]",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{body}</p>
        </div>

        {reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => toggleReaction(reaction.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
                  reaction.reacted_by_me
                    ? "bg-primary/10 border-primary"
                    : "bg-muted border-border hover:bg-accent"
                )}
              >
                <span>{reaction.emoji}</span>
                {reaction.count > 1 && (
                  <span className="text-xs font-medium">{reaction.count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {showActions && (
        <div className="absolute -top-3 right-4 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-popover border shadow-lg rounded-full"
            onClick={onReply}
            type="button"
          >
            <CornerDownRight className="h-3 w-3" />
          </Button>
          
          <QuickReactions
            onReactionClick={handleReactionClick}
            onMoreClick={handleMoreEmojis}
          />
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute top-0 right-0 z-20">
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <div />
            </PopoverTrigger>
            <PopoverContent>
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  handleReactionClick(emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
