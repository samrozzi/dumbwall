import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { CreatorBadge } from "@/components/CreatorBadge";

interface StickyNoteProps {
  content: {
    title: string;
    body: string;
    color: string;
  };
  onDelete?: () => void;
  onUpdate?: (content: { title: string; body: string; color: string }) => void;
  isCreator?: boolean;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
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

const StickyNote = ({ content, onDelete, onUpdate, isCreator, creatorAvatar, creatorUsername, stackCount }: StickyNoteProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(content.title);
  const [editBody, setEditBody] = useState(content.body);

  const handleDoubleClick = () => {
    if (isCreator && onUpdate) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (onUpdate && (editTitle.trim() || editBody.trim())) {
      onUpdate({ ...content, title: editTitle, body: editBody });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditTitle(content.title);
      setEditBody(content.body);
      setIsEditing(false);
    }
  };

  return (
    <div className="relative">
      {stackCount && stackCount > 1 && (
        <div className="absolute -right-2 -top-2 bg-secondary text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 shadow-md">
          +{stackCount - 1}
        </div>
      )}
      <Card
        className={cn(
          "p-4 w-64 shadow-lg transition-all duration-300 cursor-move relative",
          colorMap[content.color] || colorMap.yellow,
          "hover:shadow-2xl hover:scale-105",
          "transform rotate-1 hover:rotate-0"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
        style={{
          fontFamily: "'Caveat', cursive",
          minHeight: "200px",
          maxHeight: "400px",
        }}
      >
        <CreatorBadge avatarUrl={creatorAvatar} username={creatorUsername} />
        
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
        
        {isEditing ? (
          <div className="h-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-xl font-bold mb-2 bg-transparent border-b border-current outline-none"
              autoFocus
            />
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm flex-1 bg-transparent outline-none resize-none"
              style={{ fontFamily: "'Caveat', cursive" }}
            />
            <p className="text-xs opacity-70">Double-click to edit • Esc to cancel</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-2 break-words">{content.title}</h3>
            <p className="text-sm whitespace-pre-wrap break-words overflow-hidden">
              {content.body}
            </p>
            {isCreator && (
              <p className="text-xs opacity-70 mt-2">Double-click to edit</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default StickyNote;
