import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [isOpen, setIsOpen] = useState(false);

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
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        <img
          src={content.url}
          alt={content.caption || "Wall image"}
          className="w-full h-64 sm:h-48 object-cover rounded-md mb-2"
        />
      </div>
      {content.caption && (
        <p className="text-sm text-foreground px-2 pb-2">{content.caption}</p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-4 border-primary shadow-[0_0_0_4px_black,0_0_0_8px_white,0_0_20px_rgba(0,0,0,0.5)]">
          <div className="relative">
            <img
              src={content.url}
              alt={content.caption || "Wall image"}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            {content.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 border-t-4 border-primary">
                <p className="text-white text-lg font-bold" style={{ textShadow: '2px 2px 0px #000, -1px -1px 0px #fff' }}>
                  {content.caption}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ImageCard;
