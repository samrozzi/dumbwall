import { useState } from "react";
import { Card } from "@/components/ui/card";
import { MessageCircle, X } from "lucide-react";

interface ThreadBubbleProps {
  content: {
    title: string;
  };
  onDelete?: () => void;
  onClick?: () => void;
}

const ThreadBubble = ({ content, onDelete, onClick }: ThreadBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="p-4 w-64 bg-accent text-accent-foreground shadow-lg transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 transform rotate-2 hover:rotate-0 relative"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <div className="flex items-start gap-3">
        <MessageCircle className="w-5 h-5 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold mb-1">{content.title}</h3>
          <p className="text-sm opacity-80">Click to view thread</p>
        </div>
      </div>
    </Card>
  );
};

export default ThreadBubble;
