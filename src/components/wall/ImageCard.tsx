import { useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { CreatorBadge } from "@/components/CreatorBadge";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  content: {
    url: string;
    caption?: string;
  };
  onDelete?: () => void;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
  hideAvatar?: boolean;
  fullWidth?: boolean;
}

const ImageCard = ({ content, onDelete, creatorAvatar, creatorUsername, hideAvatar, fullWidth }: ImageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={cn(
        "p-2 bg-card shadow-lg transition-all duration-300 cursor-move hover:shadow-2xl hover:scale-105 transform -rotate-1 hover:rotate-0 relative",
        fullWidth ? "w-full" : "w-64"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!hideAvatar && <CreatorBadge avatarUrl={creatorAvatar} username={creatorUsername} />}
      
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
      <img
        src={content.url}
        alt={content.caption || "Wall image"}
        className="w-full h-48 object-cover rounded-md mb-2 pointer-events-none select-none"
        draggable={false}
      />
      {content.caption && (
        <p className="text-sm text-foreground px-2 pb-2">{content.caption}</p>
      )}
    </Card>
  );
};

export default ImageCard;
