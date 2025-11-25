import { useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreatorBadge } from "@/components/CreatorBadge";
import { CardPersonality } from "@/components/wall/CardPersonality";
import { cn } from "@/lib/utils";
import { PhotoViewDialog } from "@/components/wall/PhotoViewDialog";

interface ImageCardProps {
  id: string;
  content: {
    url: string;
    caption?: string;
  };
  onDelete?: () => void;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
  hideAvatar?: boolean;
  fullWidth?: boolean;
  currentUserId?: string;
}

const ImageCard = ({ 
  id,
  content, 
  onDelete, 
  creatorAvatar, 
  creatorUsername, 
  hideAvatar, 
  fullWidth,
  currentUserId 
}: ImageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  return (
    <CardPersonality type="image" className={fullWidth ? "w-full" : "w-64"}>
      <Card
        className={cn(
          "group relative bg-card shadow-lg transition-all duration-300 cursor-move hover:shadow-2xl hover:scale-105 overflow-visible rounded-3xl",
          fullWidth ? "w-full max-w-full" : "w-64"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {!hideAvatar && <CreatorBadge avatarUrl={creatorAvatar} username={creatorUsername} className="absolute top-2 left-2 z-10" />}
      
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full w-8 h-8 shadow-md hover:scale-110 transition-all z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div 
        onMouseDown={(e) => {
          setDragStartPos({ x: e.clientX, y: e.clientY });
          setWasDragged(false);
        }}
        onMouseMove={(e) => {
          const distMoved = Math.sqrt(
            Math.pow(e.clientX - dragStartPos.x, 2) + 
            Math.pow(e.clientY - dragStartPos.y, 2)
          );
          if (distMoved > 5) {
            setWasDragged(true);
          }
        }}
        onMouseUp={() => {
          if (!wasDragged) {
            setIsOpen(true);
          }
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          setDragStartPos({ x: touch.clientX, y: touch.clientY });
          setWasDragged(false);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const distMoved = Math.sqrt(
            Math.pow(touch.clientX - dragStartPos.x, 2) + 
            Math.pow(touch.clientY - dragStartPos.y, 2)
          );
          if (distMoved > 5) {
            setWasDragged(true);
          }
        }}
        onTouchEnd={() => {
          if (!wasDragged) {
            setIsOpen(true);
          }
        }}
        className="cursor-pointer overflow-hidden rounded-3xl bg-transparent"
      >
        <img
          src={content.url}
          alt={content.caption || "Wall image"}
          className="w-full h-full object-cover block"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
      {content.caption && (
        <p className="mt-2 text-sm text-neutral-100 break-words px-3 pb-3">{content.caption}</p>
      )}

      <PhotoViewDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        wallItemId={id}
        content={content}
        type="image"
        currentUserId={currentUserId}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this image from the wall.
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
    </Card>
    </CardPersonality>
  );
};

export default ImageCard;
