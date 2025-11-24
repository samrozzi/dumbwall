import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Member {
  user_id: string;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const People = () => {
  const { circleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [invitePermission, setInvitePermission] = useState<'anyone' | 'owner_only'>('owner_only');

  useEffect(() => {
    if (circleId && user) {
      loadMembers();
      loadCircleInfo();
    }
  }, [circleId, user]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("circle_members")
        .select(`
          user_id,
          profiles!circle_members_user_id_fkey(username, display_name, avatar_url)
        `)
        .eq("circle_id", circleId);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        user_id: item.user_id,
        profile: item.profiles as any
      })) || [];
      
      setMembers(transformedData as Member[]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCircleInfo = async () => {
    if (!circleId || !user) return;

    try {
      // Get circle info
      const { data: circle } = await supabase
        .from("circles")
        .select("name, created_by")
        .eq("id", circleId)
        .single();

      if (circle) {
        setCircleName(circle.name);
        setIsOwner(circle.created_by === user.id);
      }

      // Get circle settings
      const { data: settings } = await supabase
        .from("circle_settings")
        .select("invite_permission")
        .eq("circle_id", circleId)
        .maybeSingle();

      setInvitePermission(settings?.invite_permission || 'owner_only');
    } catch (error: any) {
      console.error("Error loading circle info:", error);
    }
  };

  const handleStartChat = async (otherUserId: string, otherUserName: string) => {
    if (!user || !circleId) return;

    try {
      // Check if a private thread already exists between these two users
      const { data: existingThreads, error: searchError } = await supabase
        .from("chat_threads")
        .select("id, title")
        .eq("circle_id", circleId)
        .is("linked_wall_item_id", null);

      if (searchError) throw searchError;

      // Find existing private thread between these two users
      let threadId: string | null = null;
      
      if (existingThreads) {
        for (const thread of existingThreads) {
          // Check if this thread only has messages from these two users
          const { data: messages, error: msgError } = await supabase
            .from("chat_messages")
            .select("sender_id")
            .eq("thread_id", thread.id);

          if (msgError) continue;

          const senderIds = new Set(messages?.map(m => m.sender_id) || []);
          if (
            senderIds.size <= 2 &&
            senderIds.has(user.id) &&
            senderIds.has(otherUserId)
          ) {
            threadId = thread.id;
            break;
          }
        }
      }

      // Create new thread if none exists
      if (!threadId) {
        const { data: newThread, error: threadError } = await supabase
          .from("chat_threads")
          .insert({
            circle_id: circleId,
            title: `Chat with ${otherUserName}`,
            created_by: user.id,
          })
          .select()
          .single();

        if (threadError) throw threadError;
        threadId = newThread.id;
      }

      // Navigate to chat with this thread selected
      navigate(`/circle/${circleId}/chat?thread=${threadId}`);
    } catch (error: any) {
      toast.error("Failed to start chat: " + error.message);
    }
  };

  const getDisplayName = (member: Member) => {
    return member.profile?.display_name || member.profile?.username || "Unknown User";
  };

  const getInitials = (member: Member) => {
    const name = getDisplayName(member);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const canAddMembers = isOwner || invitePermission === 'anyone';

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation circleId={circleId} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{circleName}</h1>
          {canAddMembers && (
            <Button onClick={() => setAddMemberOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => {
            const rotation = (index % 2 === 0 ? 1 : -1) * (1 + (index % 3));
            const gradients = [
              'from-pink-400 via-purple-400 to-pink-500',
              'from-yellow-400 via-orange-400 to-pink-500',
              'from-cyan-400 via-blue-400 to-purple-500',
              'from-green-400 via-teal-400 to-cyan-500',
            ];
            const gradient = gradients[index % gradients.length];
            
            return (
              <Card 
                key={member.user_id}
                className={cn(
                  "cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-300 relative",
                  "bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-sm",
                  "border-4 p-1"
                )}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  borderImage: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))) 1`,
                }}
                onClick={() => navigate(`/u/${member.profile.username}`)}
              >
                {/* Decorative corner sticker */}
                <div 
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-70 z-10"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  }}
                />
                
                <CardContent className="p-6 relative">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg ring-2 ring-primary/20">
                      <AvatarImage src={member.profile.avatar_url || undefined} />
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 to-accent/20">
                        {getInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="font-bold text-lg truncate">
                        {getDisplayName(member)}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        @{member.profile.username}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        circleId={circleId || ""}
        circleName={circleName}
        isOwner={isOwner}
        invitePermission={invitePermission}
        onSuccess={() => { loadMembers(); }}
      />
    </div>
  );
};

export default People;
