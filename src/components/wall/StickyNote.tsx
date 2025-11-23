import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface StickyNoteProps {
  content: {
    title: string;
    body: string;
    color: string;
  };
  onDelete?: () => void;
  stackCount?: number;
}

const colorMap: Record<string, string> = {
  yellow: "bg-note-yellow text-background",
  pink: "bg-note-pink text-background",
  blue: "bg-note-blue text-background",
  orange: "bg-note-orange text-background",
  green: "bg-note-green text-background",
  purple: "bg-note-purple text-background",
  cream: "bg-note-cream text-background",
};

const StickyNote = ({ content, onDelete, stackCount }: StickyNoteProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      {stackCount && stackCount > 1 && (
        <div className="absolute -right-2 -top-2 bg-secondary text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 shadow-md">
          +{stackCount - 1}
        </div>
      )}
      <Card
        className={cn(
          "p-4 w-64 h-64 shadow-lg transition-all duration-300 cursor-move relative",
          colorMap[content.color] || colorMap.yellow,
          "hover:shadow-2xl hover:scale-105",
          "transform rotate-1 hover:rotate-0"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          fontFamily: "'Caveat', cursive",
        }}
      >
        {onDelete && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-transform z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <h3 className="text-xl font-bold mb-2 break-words">{content.title}</h3>
        <p className="text-sm whitespace-pre-wrap break-words overflow-hidden">
          {content.body}
        </p>
      </Card>
    </div>
  );
};

export default StickyNote;
