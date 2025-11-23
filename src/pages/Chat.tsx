import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, ArrowLeft } from "lucide-react";
import { notify } from "@/components/ui/custom-notification";

interface ChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  body: string;
  sender_id: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

const Chat = () => {
  const { circleId } = useParams();
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get("threadId");
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!user || !circleId) return;

    if (threadId) {
      loadThread();
      loadMessages();
      subscribeToMessages();
    } else {
      loadThreads();
    }
  }, [user, circleId, threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("*")
        .eq("circle_id", circleId!)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const loadThread = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("*")
        .eq("id", threadId!)
        .single();

      if (error) throw error;
      setCurrentThread(data);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all senders
      const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", senderIds);

      const messagesWithProfiles = (data || []).map((msg) => ({
        ...msg,
        profiles: profiles?.find((p) => p.id === msg.sender_id) || { display_name: "Unknown" },
      }));

      setMessages(messagesWithProfiles as ChatMessage[]);
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          // Fetch the sender's profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...payload.new, profiles: profile } as ChatMessage,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadId) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        thread_id: threadId,
        sender_id: user!.id,
        body: newMessage,
      });

      if (error) throw error;

      // Update thread's updated_at
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadId);

      setNewMessage("");
    } catch (error: any) {
      notify(error.message, "error");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!threadId) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation circleId={circleId} />
        <div className="pl-24 pr-8 pt-8">
          <h1 className="text-3xl font-bold mb-6">Chat Threads</h1>
          <div className="grid gap-4 max-w-4xl">
            {threads.length === 0 ? (
              <p className="text-muted-foreground">
                No threads yet. Create one from The Wall!
              </p>
            ) : (
              threads.map((thread) => (
                <Card
                  key={thread.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    navigate(
                      `/circle/${circleId}/chat?threadId=${thread.id}`
                    )
                  }
                >
                  <h3 className="text-lg font-semibold">{thread.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Updated: {new Date(thread.updated_at).toLocaleString()}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation circleId={circleId} />
      <div className="pl-24 pr-8 pt-8 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/circle/${circleId}/chat`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">{currentThread?.title}</h1>
        </div>

        <Card className="flex-1 flex flex-col max-w-4xl w-full mb-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user?.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.sender_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  {message.sender_id !== user?.id && (
                    <p className="text-xs opacity-70 mb-1">
                      {message.profiles?.display_name || "Unknown"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
