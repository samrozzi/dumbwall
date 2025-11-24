import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Search } from "lucide-react";
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

// Emoji name mappings for search
const EMOJI_NAMES: Record<string, string[]> = {
  '👍': ['thumbs', 'up', 'like', 'approve', 'yes'],
  '❤️': ['heart', 'love', 'red'],
  '😂': ['laugh', 'lol', 'funny', 'joy', 'tears'],
  '👎': ['thumbs', 'down', 'dislike', 'no'],
  '🔥': ['fire', 'hot', 'lit'],
  '🎉': ['party', 'celebrate', 'confetti'],
  '👏': ['clap', 'applause', 'bravo'],
  '💯': ['hundred', 'perfect', '100'],
  '😊': ['smile', 'happy', 'blush'],
  '😁': ['grin', 'smile', 'happy', 'teeth'],
  '😅': ['sweat', 'nervous', 'relief'],
  '😍': ['heart', 'eyes', 'love', 'crush'],
  '🥰': ['love', 'hearts', 'adore'],
  '😎': ['cool', 'sunglasses'],
  '🤔': ['think', 'hmm', 'curious'],
  '😴': ['sleep', 'tired', 'zzz'],
  '🥺': ['pleading', 'puppy', 'eyes', 'beg'],
  '😭': ['cry', 'sob', 'tears', 'sad'],
  '😮': ['wow', 'surprise', 'shocked'],
  '😢': ['cry', 'sad', 'tear'],
  '🤗': ['hug', 'embrace'],
  '🤩': ['star', 'struck', 'wow', 'amazed'],
  '😇': ['angel', 'innocent', 'halo'],
  '🙃': ['upside', 'down', 'silly'],
  '👋': ['wave', 'hi', 'hello', 'bye'],
  '🙏': ['pray', 'thanks', 'please', 'namaste'],
  '💪': ['muscle', 'strong', 'flex'],
  '✌️': ['peace', 'victory', 'two'],
  '🤝': ['handshake', 'deal', 'agreement'],
  '👊': ['fist', 'bump', 'punch'],
  '🫶': ['heart', 'hands', 'love'],
  '✋': ['hand', 'stop', 'high', 'five'],
  '🤙': ['call', 'shaka', 'hang', 'loose'],
  '👌': ['ok', 'okay', 'perfect'],
  '🤞': ['fingers', 'crossed', 'luck', 'hope'],
  '💕': ['hearts', 'love', 'pink'],
  '💖': ['sparkle', 'heart', 'love'],
  '💗': ['growing', 'heart', 'love'],
  '💓': ['beating', 'heart', 'love'],
  '💞': ['revolving', 'hearts', 'love'],
  '💘': ['arrow', 'heart', 'cupid', 'love'],
  '💝': ['gift', 'heart', 'love'],
  '🧡': ['orange', 'heart', 'love'],
  '💛': ['yellow', 'heart', 'love'],
  '💚': ['green', 'heart', 'love'],
  '💙': ['blue', 'heart', 'love'],
  '💜': ['purple', 'heart', 'love'],
  '🖤': ['black', 'heart', 'love'],
  '🤍': ['white', 'heart', 'love'],
  '🤎': ['brown', 'heart', 'love'],
  '💬': ['chat', 'message', 'bubble', 'talk'],
  '📱': ['phone', 'mobile', 'cell'],
  '🎵': ['music', 'note', 'song'],
  '⭐': ['star', 'favorite'],
  '✨': ['sparkle', 'shine', 'magic'],
  '🌈': ['rainbow', 'colors'],
  '🎁': ['gift', 'present', 'box'],
  '🎂': ['cake', 'birthday'],
  '🎊': ['confetti', 'ball', 'celebrate'],
  '🎈': ['balloon', 'party'],
  '🔔': ['bell', 'notification', 'ring'],
  '💡': ['bulb', 'idea', 'light'],
};

export function EmojiPicker({ onEmojiSelect, trigger }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getFilteredEmojis = () => {
    if (!searchQuery.trim()) {
      return EMOJI_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, string[]> = {};

    Object.entries(EMOJI_CATEGORIES).forEach(([category, emojis]) => {
      const matchedEmojis = emojis.filter(emoji => {
        const names = EMOJI_NAMES[emoji] || [];
        return names.some(name => name.includes(query));
      });

      if (matchedEmojis.length > 0) {
        filtered[category] = matchedEmojis;
      }
    });

    return filtered;
  };

  const filteredCategories = getFilteredEmojis();

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
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <ScrollArea className="h-80">
            {Object.keys(filteredCategories).length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No emojis found
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(filteredCategories).map(([category, emojis]) => (
                  <div key={category}>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">{category}</h4>
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-xl hover:bg-accent transition-colors"
                          onClick={() => {
                            onEmojiSelect(emoji);
                            setSearchQuery('');
                          }}
                          type="button"
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
