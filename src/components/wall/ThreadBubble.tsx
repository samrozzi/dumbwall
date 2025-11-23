import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { X, MessageSquare, Send, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!content.threadId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", content.threadId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setMessages(data.reverse());
      }
    };

    loadMessages();

    const channel = supabase
      .channel(`thread-bubble-${content.threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${content.threadId}`,
        },
        (payload) => {
          setMessages((prev) => {
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from("chat_messages").insert({
      thread_id: content.threadId,
      body: newMessage.trim(),
      sender_id: user.id,
    });

    if (!error) {
      setNewMessage("");
      setNewCount(0);
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", content.threadId);
    }
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <Card
      className="p-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minHeight: "200px", maxHeight: "280px" }}
    >
      {onDelete && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {newCount > 0 && (
        <Badge 
          className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600"
        >
          {newCount}
        </Badge>
      )}

      <div className="flex items-start gap-2 flex-1 min-h-0 max-w-full">
        <MessageSquare className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0 flex flex-col min-h-0 max-w-full overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-purple-900 truncate">{content.title}</h3>
            <button
              onClick={handleNavigate}
              className="text-purple-600 hover:text-purple-800 hover:scale-110 transition-transform flex-shrink-0 ml-2"
              title="Open thread"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="space-y-1 text-sm text-purple-700 pb-1">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <p key={msg.id} className="break-words line-clamp-2">• {msg.body}</p>
                ))
              ) : (
                <p className="text-purple-500 italic">No messages yet</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-purple-200 flex gap-2">
        <Input
          placeholder="Reply..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          onClick={(e) => e.stopPropagation()}
          className="h-8 text-sm"
        />
        <Button onClick={handleSendMessage} size="sm" className="h-8 w-8 p-0">
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};

export default ThreadBubble;
