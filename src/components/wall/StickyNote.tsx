import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { CreatorBadge } from "@/components/CreatorBadge";
import { CardPersonality } from "@/components/wall/CardPersonality";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  hideAvatar?: boolean;
  fullWidth?: boolean;
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

const StickyNote = ({ content, onDelete, onUpdate, isCreator, creatorAvatar, creatorUsername, stackCount, hideAvatar, fullWidth }: StickyNoteProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(content.title);
  const [editBody, setEditBody] = useState(content.body);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    <CardPersonality type="note" className={fullWidth ? "w-full" : "w-64"}>
      <div className="relative">
        {stackCount && stackCount > 1 && (
          <div className="absolute -right-2 -top-2 bg-secondary text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 shadow-md">
            +{stackCount - 1}
          </div>
        )}
        <Card
        className={cn(
          "group p-4 shadow-lg transition-all duration-300 cursor-move relative",
          fullWidth ? "w-full max-w-full" : "w-64",
          colorMap[content.color] || colorMap.yellow,
          "hover:shadow-2xl hover:scale-105"
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
        {!hideAvatar && <CreatorBadge avatarUrl={creatorAvatar} username={creatorUsername} />}
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-8 h-8 shadow-md hover:scale-110 transition-all z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <X className="w-5 h-5" />
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sticky note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this sticky note from the wall.
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
      </div>
    </CardPersonality>
  );
};

export default StickyNote;
