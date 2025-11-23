import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";
import { MessageSquare, Plus, Send, UserPlus, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MemberPicker from "@/components/chat/MemberPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThreadAvatarStack } from "@/components/chat/ThreadAvatarStack";

interface ChatThread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  linked_wall_item_id: string | null;
}

interface ThreadMember {
  id: string;
  avatar_url: string | null;
  username: string | null;
  display_name: string | null;
}

interface ThreadWithMembers extends ChatThread {
  members: ThreadMember[];
}

interface ChatMessage {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

const Chat = () => {
  const { circleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const threadId = searchParams.get("threadId");
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [threads, setThreads] = useState<ThreadWithMembers[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "wall" | "convos">("all");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (circleId) {
      loadThreads();
    }
  }, [circleId]);

  useEffect(() => {
    const urlThreadId = searchParams.get("thread");
    if (urlThreadId && threads.length > 0) {
      navigate(`/circle/${circleId}/chat?threadId=${urlThreadId}`);
    } else if (threadId) {
      loadThread();
      loadMessages();
      subscribeToMessages();
    }
  }, [threadId, searchParams, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadThreads = async () => {
    const { data: threadsData, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("circle_id", circleId!)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Error loading threads");
      return;
    }

    if (!threadsData || threadsData.length === 0) {
      setThreads([]);
      return;
    }

    // Fetch thread members and their profiles
    const threadIds = threadsData.map(t => t.id);
    const { data: membersData } = await supabase
      .from("thread_members")
      .select("thread_id, user_id")
      .in("thread_id", threadIds);

    const userIds = [...new Set(membersData?.map(m => m.user_id) || [])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, avatar_url, username, display_name")
      .in("id", userIds);

    // Combine data
    const threadsWithMembers = threadsData.map(thread => {
      const threadMembers = membersData?.filter(m => m.thread_id === thread.id) || [];
      const members = threadMembers
        .map(tm => profilesData?.find(p => p.id === tm.user_id))
        .filter(Boolean) as ThreadMember[];
      
      return {
        ...thread,
        members
      };
    });

    setThreads(threadsWithMembers);
  };

  const loadThread = async () => {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("id", threadId!)
      .single();

    if (error) {
      toast.error("Error loading thread");
      return;
    }
    setCurrentThread(data);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId!)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Error loading messages");
      return;
    }

    // Fetch profiles for all senders
    const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", senderIds);

    const messagesWithProfiles = (data || []).map((msg) => ({
      ...msg,
      profiles: profiles?.find((p) => p.id === msg.sender_id) || { display_name: null, username: null, avatar_url: null },
    }));

    setMessages(messagesWithProfiles as ChatMessage[]);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
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
    if (!newMessage.trim() || !user || !threadId) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Fetch current user profile for optimistic update
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .single();
    
    // Optimistic UI update
    const optimisticMessage: ChatMessage = {
      id: tempId,
      body: messageText,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      profiles: userProfile || { display_name: null, username: null, avatar_url: null },
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert({
      thread_id: threadId,
      body: messageText,
      sender_id: user.id,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Failed to send message");
      setNewMessage(messageText);
      return;
    }

    await supabase
      .from("chat_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId);
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !user || !circleId) return;
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    const { data, error } = await supabase
      .from("chat_threads")
      .insert({
        circle_id: circleId,
        created_by: user.id,
        title: newThreadTitle,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create thread");
      return;
    }

    // Add creator and selected members to thread_members
    const membersToAdd = [...new Set([user.id, ...selectedMembers])];
    const { error: membersError } = await supabase
      .from("thread_members")
      .insert(
        membersToAdd.map((userId) => ({
          thread_id: data.id,
          user_id: userId,
        }))
      );

    if (membersError) {
      toast.error("Failed to add members to thread");
      return;
    }

    setCreateDialogOpen(false);
    setNewThreadTitle("");
    setSelectedMembers([]);
    loadThreads();
    toast.success(`Thread created with ${membersToAdd.length} member${membersToAdd.length > 1 ? 's' : ''}`);
    navigate(`/circle/${circleId}/chat?threadId=${data.id}`);
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (!threadId || selectedMembers.length === 0) return;

    const { error } = await supabase
      .from("thread_members")
      .insert(
        selectedMembers.map((userId) => ({
          thread_id: threadId,
          user_id: userId,
        }))
      );

    if (error) {
      toast.error("Failed to add members");
      return;
    }

    setAddMembersDialogOpen(false);
    setSelectedMembers([]);
    toast.success(`Added ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} to thread`);
  };

  const filteredThreads = threads.filter((thread) => {
    if (filter === "wall") return thread.linked_wall_item_id !== null;
    if (filter === "convos") return thread.linked_wall_item_id === null;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />
      <div className={`${isMobile ? 'px-4 pt-4 pb-20' : 'pl-24 pr-8 pt-8'} ${isMobile ? 'h-[calc(100vh-80px)]' : 'flex gap-4 h-[calc(100vh-80px)]'}`}>
        {isMobile ? (
          /* Mobile: Show either thread list OR chat view */
          <>
            {!threadId ? (
              /* Thread List View */
              <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Threads</h2>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="default">
                        <Plus className="w-4 h-4 mr-2" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Thread</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Thread title..."
                          value={newThreadTitle}
                          onChange={(e) => setNewThreadTitle(e.target.value)}
                        />
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Add Members ({selectedMembers.length} selected)
                          </label>
                          <MemberPicker
                            circleId={circleId!}
                            selectedMembers={selectedMembers}
                            onMemberToggle={handleMemberToggle}
                            excludeUserIds={[user?.id || ""]}
                          />
                        </div>
                        <Button 
                          onClick={handleCreateThread} 
                          className="w-full"
                          disabled={!newThreadTitle.trim() || selectedMembers.length === 0}
                        >
                          Create Thread with {selectedMembers.length + 1} member{selectedMembers.length + 1 > 1 ? 's' : ''}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="wall" className="flex-1">Wall</TabsTrigger>
                    <TabsTrigger value="convos" className="flex-1">Convos</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <ScrollArea className="flex-1 border rounded-lg bg-card/50 backdrop-blur">
                  <div className="p-1 space-y-1">
                    {filteredThreads.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => navigate(`/circle/${circleId}/chat?threadId=${thread.id}`)}
                        className="w-full text-left p-3 rounded-lg transition-all hover:bg-card bg-card/40 flex items-center gap-3"
                      >
                        <ThreadAvatarStack 
                          members={thread.members} 
                          currentUserId={user?.id || ""} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{thread.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(thread.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        {thread.linked_wall_item_id && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded flex-shrink-0">
                            Wall
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              /* Chat View with Back Button */
              <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
                <div className="p-4 border-b bg-card flex items-center gap-3">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => navigate(`/circle/${circleId}/chat`)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h3 className="text-xl font-bold flex-1">{currentThread?.title}</h3>
                  <Dialog open={addMembersDialogOpen} onOpenChange={setAddMembersDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedMembers([])}>
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Members to Thread</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <MemberPicker
                          circleId={circleId!}
                          selectedMembers={selectedMembers}
                          onMemberToggle={handleMemberToggle}
                        />
                        <Button 
                          onClick={handleAddMembers} 
                          className="w-full"
                          disabled={selectedMembers.length === 0}
                        >
                          Add {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={message.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {message.profiles?.username?.slice(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender_id === user?.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <div className="text-xs opacity-70 mb-1">
                            @{message.profiles?.username || message.profiles?.display_name || "Unknown"}
                          </div>
                          <div>{message.body}</div>
                          <div className="text-xs opacity-50 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t bg-card">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop: Two-column layout */
          <>
            {/* Threads Sidebar */}
            <div className="w-[30%] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Threads</h2>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default">
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Thread title..."
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                  />
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Add Members ({selectedMembers.length} selected)
                    </label>
                    <MemberPicker
                      circleId={circleId!}
                      selectedMembers={selectedMembers}
                      onMemberToggle={handleMemberToggle}
                      excludeUserIds={[user?.id || ""]}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateThread} 
                    className="w-full"
                    disabled={!newThreadTitle.trim() || selectedMembers.length === 0}
                  >
                    Create Thread with {selectedMembers.length + 1} member{selectedMembers.length + 1 > 1 ? 's' : ''}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="wall" className="flex-1">Wall Threads</TabsTrigger>
              <TabsTrigger value="convos" className="flex-1">Convos</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="flex-1 border rounded-lg bg-card/50 backdrop-blur">
            <div className="p-2 space-y-2">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => navigate(`/circle/${circleId}/chat?threadId=${thread.id}`)}
                  className={`w-full text-left p-3 rounded-lg transition-all hover:bg-card ${
                    threadId === thread.id ? "bg-card shadow-md" : "bg-card/40"
                  }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    {thread.linked_wall_item_id && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Wall
                      </span>
                    )}
                    {thread.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
          {threadId && currentThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card flex items-center justify-between">
                <h3 className="text-xl font-bold">{currentThread.title}</h3>
                <Dialog open={addMembersDialogOpen} onOpenChange={setAddMembersDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => setSelectedMembers([])}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Members to Thread</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <MemberPicker
                        circleId={circleId!}
                        selectedMembers={selectedMembers}
                        onMemberToggle={handleMemberToggle}
                      />
                      <Button 
                        onClick={handleAddMembers} 
                        className="w-full"
                        disabled={selectedMembers.length === 0}
                      >
                        Add {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {message.profiles?.username?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          @{message.profiles?.username || message.profiles?.display_name || "Unknown"}
                        </div>
                        <div>{message.body}</div>
                        <div className="text-xs opacity-50 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-card">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a thread to start chatting</p>
              </div>
            </div>
          )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
