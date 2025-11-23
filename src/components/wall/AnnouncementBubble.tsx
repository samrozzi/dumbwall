import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Megaphone, X } from "lucide-react";
import { CreatorBadge } from "@/components/CreatorBadge";

interface AnnouncementBubbleProps {
  content: {
    text: string;
  };
  onDelete?: () => void;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
}

const AnnouncementBubble = ({ content, onDelete, creatorAvatar, creatorUsername }: AnnouncementBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      {creatorAvatar && creatorUsername && (
        <CreatorBadge avatarUrl={creatorAvatar} username={creatorUsername} />
      )}
      
      {/* Windows 98 Style Popup */}
      <Card 
        className="w-full min-w-[300px] max-w-[400px] border-2 border-[#0000AA] bg-gradient-to-b from-[#0000AA] to-[#1084D0] shadow-[inset_1px_1px_0px_rgba(255,255,255,0.3),inset_-1px_-1px_0px_rgba(0,0,0,0.3)] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0000AA] to-[#1084D0] px-2 py-1 flex items-center justify-between border-b border-[#FFFFFF40]">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">Announcement</span>
          </div>
          {onDelete && isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-5 h-5 bg-[#C0C0C0] hover:bg-[#E0E0E0] border border-white shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_#808080] flex items-center justify-center text-black font-bold text-xs transition-colors"
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
          
          {/* OK Button */}
          <div className="mt-4 flex justify-center">
            <button className="px-8 py-1 bg-[#C0C0C0] border-2 border-[#FFFFFF] shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_#808080,2px_2px_0px_#000000] hover:shadow-[inset_-1px_-1px_0px_white,inset_1px_1px_0px_#808080] active:shadow-[inset_1px_1px_0px_#808080,inset_-1px_-1px_0px_white] text-black text-sm font-sans min-w-[75px]">
              <span className="underline">O</span>K
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnnouncementBubble;
