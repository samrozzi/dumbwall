import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Megaphone, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CreatorBadge } from "@/components/CreatorBadge";

interface AnnouncementBubbleProps {
  content: {
    text: string;
  };
  onDelete?: () => void;
  onUpdate?: (newContent: { text: string }) => void;
  isCreator?: boolean;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
}

const AnnouncementBubble = ({ content, onDelete, onUpdate, isCreator, creatorAvatar, creatorUsername }: AnnouncementBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content.text);

  const handleClick = () => {
    if (isCreator && onUpdate) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (onUpdate && editText.trim()) {
      onUpdate({ text: editText });
      setIsEditing(false);
    }
  };

  return (
    <>
      <Card
        className="p-4 w-72 bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-lg transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 relative"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          borderRadius: "1.5rem 1.5rem 1.5rem 0.25rem",
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
        <div className="flex items-start gap-3">
          <Megaphone className="w-6 h-6 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-lg font-semibold leading-relaxed">{content.text}</p>
            {isCreator && (
              <p className="text-xs opacity-70 mt-2">Click to edit</p>
            )}
          </div>
        </div>
      </Card>

      {isCreator && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Enter your announcement..."
                maxLength={280}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground text-right">
                {editText.length}/280 characters
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!editText.trim()}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AnnouncementBubble;
