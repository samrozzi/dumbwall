import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Megaphone, X } from "lucide-react";
import { CreatorBadge } from "@/components/CreatorBadge";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AnnouncementBubbleProps {
  content: {
    text: string;
  };
  onDelete?: () => void;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
  hideAvatar?: boolean;
  fullWidth?: boolean;
}

const AnnouncementBubble = ({ content, onDelete, creatorAvatar, creatorUsername, hideAvatar, fullWidth }: AnnouncementBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="relative">
      {!hideAvatar && creatorAvatar && creatorUsername && (
        <CreatorBadge avatarUrl={creatorAvatar} username={creatorUsername} />
      )}
      
      {/* Windows 98 Style Popup */}
      <Card 
        className={cn(
          "border-2 border-[#0000AA] bg-gradient-to-b from-[#0000AA] to-[#1084D0] shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3),inset_-1px_-1px_0px_rgba(0,0,0,0.3)] overflow-hidden",
          fullWidth ? "w-full max-w-full" : "w-full min-w-[300px] max-w-[400px]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0000AA] to-[#1084D0] px-2 py-1 flex items-center justify-between border-b border-[#FFFFFF40]">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">Announcement</span>
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="w-6 h-6 bg-[#C0C0C0] hover:bg-[#E0E0E0] border border-white shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_#808080] flex items-center justify-center text-black font-bold text-sm transition-colors"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Content Area */}
        <div className="bg-[#C0C0C0] p-4 border-2 border-[#808080] shadow-[inset_-1px_-1px_0px_white,inset_1px_1px_0px_#000000]">
          <div className="flex gap-3">
            {/* Question Mark Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-white border border-[#808080] rounded-full flex items-center justify-center shadow-md">
              <span className="text-2xl text-[#0000AA] font-bold">?</span>
            </div>
            
            {/* Message */}
            <div className="flex-1">
              <p className="text-black text-sm font-sans leading-relaxed whitespace-pre-wrap">
                {content.text}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this announcement from the wall.
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
  );
};

export default AnnouncementBubble;
