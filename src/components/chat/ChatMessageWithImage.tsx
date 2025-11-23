import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EmojiPicker } from "./EmojiPicker";
import { PhotoViewerDialog } from "@/components/wall/PhotoViewerDialog";

interface ChatMessageWithImageProps {
  id: string;
  body: string;
  image_url?: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  isOwn: boolean;
  onReply: () => void;
  onReaction: (emoji: string) => void;
  replyTo?: {
    sender_name: string;
    body: string;
  };
}

const ChatMessageWithImage = ({
  id,
  body,
  image_url,
  created_at,
  sender,
  isOwn,
  onReply,
  onReaction,
  replyTo,
}: ChatMessageWithImageProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  return (
    <>
      <div className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={sender.avatar_url || undefined} />
          <AvatarFallback>{sender.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className={`flex-1 max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm">
              {sender.display_name || sender.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>

          {replyTo && (
            <div className="text-xs text-muted-foreground mb-1 pl-3 border-l-2 border-primary">
              Replying to <strong>{replyTo.sender_name}</strong>: {replyTo.body.substring(0, 50)}
              {replyTo.body.length > 50 && "..."}
            </div>
          )}

          <div className={`rounded-lg overflow-hidden ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {image_url && (
              <img
                src={image_url}
                alt="Shared photo"
                className="w-full max-w-sm object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageDialogOpen(true)}
              />
            )}
            {body && (
              <div className="p-3">
                <p className="text-sm break-words whitespace-pre-wrap">{body}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={onReply}
              className="h-6 px-2"
            >
              <Reply className="w-3 h-3" />
            </Button>
            <EmojiPicker 
              onEmojiSelect={(emoji) => onReaction(emoji)}
              trigger={
                <Button size="sm" variant="ghost" className="h-6 px-2">
                  😀
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {image_url && (
        <PhotoViewerDialog
          isOpen={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          imageUrl={image_url}
          caption={body}
        />
      )}
    </>
  );
};

export default ChatMessageWithImage;
