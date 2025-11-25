import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StoryAvatar } from "./StoryAvatar";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Member {
  user_id: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    status: string | null;
    last_active_at: string | null;
  };
}

interface MembersPanelProps {
  circleId: string;
}

export const MembersPanel = ({ circleId }: MembersPanelProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();

    const channel = supabase
      .channel(`members-panel-${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "circle_members",
          filter: `circle_id=eq.${circleId}`,
        },
        () => loadMembers()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        () => loadMembers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("circle_members")
        .select(`
          user_id,
          profile:profiles(username, display_name, avatar_url, status, last_active_at)
        `)
        .eq("circle_id", circleId);

      if (error) throw error;
      setMembers((data as any) || []);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (memberId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find or create DM thread
      const { data: existingThreads } = await supabase
        .from("thread_members")
        .select("thread_id")
        .eq("user_id", user.id);

      if (existingThreads) {
        for (const threadMember of existingThreads) {
          const { data: otherMembers } = await supabase
            .from("thread_members")
            .select("user_id")
            .eq("thread_id", threadMember.thread_id)
            .neq("user_id", user.id);

          if (otherMembers?.length === 1 && otherMembers[0].user_id === memberId) {
            navigate(`/circle/${circleId}/chat?threadId=${threadMember.thread_id}`);
            return;
          }
        }
      }

      // Create new DM thread
      const { data: newThread, error: threadError } = await supabase
        .from("chat_threads")
        .insert({
          circle_id: circleId,
          created_by: user.id,
          title: "Direct Message",
        })
        .select()
        .single();

      if (threadError) throw threadError;

      await supabase.from("thread_members").insert([
        { thread_id: newThread.id, user_id: user.id },
        { thread_id: newThread.id, user_id: memberId },
      ]);

      navigate(`/circle/${circleId}/chat?threadId=${newThread.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  const isOnline = (member: Member) => {
    if (!member.profile?.last_active_at) return false;
    const lastActive = new Date(member.profile.last_active_at);
    const now = new Date();
    return now.getTime() - lastActive.getTime() < 5 * 60 * 1000; // 5 minutes
  };

  const filteredMembers = members.filter((m) => {
    const searchLower = search.toLowerCase();
    return (
      m.profile?.username?.toLowerCase().includes(searchLower) ||
      m.profile?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-4" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Members ({members.length})</h2>
        <Search className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Search */}
      <Input
        placeholder="Search members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      {/* Members List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pb-32">
          {filteredMembers.map((member) => (
            <div
              key={member.user_id}
              className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
              onClick={() => navigate(`/u/${member.profile?.username}`)}
            >
              <div className="relative">
                <StoryAvatar
                  src={member.profile?.avatar_url}
                  alt={member.profile?.display_name || member.profile?.username || "User"}
                  size="sm"
                />
                {/* Presence dot */}
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                    isOnline(member) ? "bg-green-500" : "bg-gray-500"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.profile?.display_name || member.profile?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{member.profile?.username}
                </p>
              </div>

              {/* Message button on hover */}
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartChat(member.user_id);
                }}
                title="Send Direct Message"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
