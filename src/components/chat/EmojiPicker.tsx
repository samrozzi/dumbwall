import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

const EMOJI_CATEGORIES = {
  'Frequently Used': ['👍', '❤️', '😂', '👎', '🔥', '🎉', '👏', '💯'],
  'Smileys': ['😊', '😁', '😅', '😍', '🥰', '😎', '🤔', '😴', '🥺', '😭', '😮', '😢', '🤗', '🤩', '😇', '🙃'],
  'Gestures': ['👋', '🙏', '💪', '✌️', '🤝', '👊', '🫶', '✋', '🤙', '👌', '🤞'],
  'Hearts': ['❤️', '💕', '💖', '💗', '💓', '💞', '💘', '💝', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎'],
  'Objects': ['💬', '📱', '🎵', '⭐', '✨', '🌈', '🎁', '🎂', '🎊', '🎈', '🔔', '💡'],
};

export function EmojiPicker({ onEmojiSelect, trigger }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" type="button">
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <ScrollArea className="h-80">
          <div className="space-y-4">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">{category}</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-xl hover:bg-accent"
                      onClick={() => onEmojiSelect(emoji)}
                      type="button"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
