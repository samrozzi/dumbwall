import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ThreadBubbleProps {
  content: {
    title: string;
    threadId: string;
  };
  onDelete?: () => void;
  onClick?: () => void;
}

interface Message {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
}

const ThreadBubble = ({ content, onDelete, onClick }: ThreadBubbleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!content.threadId) {
      console.error("ThreadBubble: Missing threadId");
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", content.threadId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setRecentMessages(data.reverse());
      }
    };

    loadMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`thread-${content.threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${content.threadId}`,
        },
        (payload) => {
          setRecentMessages((prev) => {
            const newMessages = [...prev, payload.new as Message];
            return newMessages.slice(-3);
          });
          setNewCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [content.threadId]);

  const handleClick = () => {
    setNewCount(0);
    onClick?.();
  };

  return (
    <Card
      className="p-4 w-64 bg-accent text-accent-foreground shadow-lg transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 transform rotate-2 hover:rotate-0 relative"
      onClick={handleClick}
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
      {newCount > 0 && (
        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md animate-in zoom-in">
          {newCount}
        </div>
      )}
      <div className="flex items-start gap-3">
        <MessageCircle className="w-5 h-5 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
          {recentMessages.length > 0 ? (
            <div className="space-y-1 text-xs opacity-80 max-h-16 overflow-hidden">
              {recentMessages.map((msg) => (
                <p key={msg.id} className="truncate">
                  • {msg.body.slice(0, 50)}{msg.body.length > 50 ? "..." : ""}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-80">No messages yet</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ThreadBubble;
