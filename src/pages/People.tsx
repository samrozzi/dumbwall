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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card 
              key={member.user_id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/u/${member.profile.username}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={member.profile.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {getDisplayName(member)}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      @{member.profile.username}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        circleId={circleId || ""}
        isOwner={isOwner}
        invitePermission={invitePermission}
        onMemberAdded={() => { loadMembers(); }}
      />
    </div>
  );
};

export default People;
