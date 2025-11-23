import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickReactionsProps {
  onReactionClick: (emoji: string) => void;
  onMoreClick: () => void;
  className?: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '👎', '🔥'];

export function QuickReactions({ onReactionClick, onMoreClick, className }: QuickReactionsProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-1 bg-popover border border-border rounded-full px-2 py-1 shadow-lg",
        className
      )}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-base hover:bg-accent rounded-full"
          onClick={() => onReactionClick(emoji)}
          type="button"
        >
          {emoji}
        </Button>
      ))}
      <div className="w-px h-4 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 hover:bg-accent rounded-full"
        onClick={onMoreClick}
        type="button"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
