import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { notify } from "@/components/ui/custom-notification";
import { UserPlus } from "lucide-react";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  circleId: string;
}

interface CircleMember {
  user_id: string;
  profiles: {
    display_name: string | null;
  };
}

export const InviteMemberDialog = ({
  open,
  onOpenChange,
  gameId,
  circleId,
}: InviteMemberDialogProps) => {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open, circleId, gameId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      // Get circle members
      const { data: circleMembers } = await supabase
        .from("circle_members")
        .select("user_id, profiles(display_name)")
        .eq("circle_id", circleId);

      // Get current game participants
      const { data: participants } = await supabase
        .from("game_participants")
        .select("user_id")
        .eq("game_id", gameId);

      // Get pending invites
      const { data: pendingInvites } = await supabase
        .from("game_invites")
        .select("invited_user_id")
        .eq("game_id", gameId)
        .eq("status", "pending");

      const participantIds = new Set(participants?.map((p) => p.user_id) || []);
      const invitedIds = new Set(pendingInvites?.map((i) => i.invited_user_id) || []);

      // Filter out users already in the game or invited
      const availableMembers = circleMembers?.filter(
        (m) => !participantIds.has(m.user_id) && !invitedIds.has(m.user_id)
      ) || [];

      setMembers(availableMembers);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create invite
      const { error: inviteError } = await supabase
        .from("game_invites")
        .insert({
          game_id: gameId,
          invited_user_id: userId,
          invited_by: user.id,
          status: "pending",
        });

      if (inviteError) throw inviteError;

      // Get game info
      const { data: game } = await supabase
        .from("games")
        .select("title, type")
        .eq("id", gameId)
        .single();

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "game_invite",
        title: "Game Invitation",
        message: `You've been invited to play ${game?.title || game?.type}`,
        link: `/circle/${circleId}/games`,
        metadata: { game_id: gameId },
      });

      notify("Invitation sent!");
      loadMembers();
    } catch (error) {
      console.error("Error sending invite:", error);
      notify("Failed to send invitation");
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Circle Members</DialogTitle>
          <DialogDescription>
            Invite members from your circle to join this game
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No available members to invite</p>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.profiles?.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {member.profiles?.display_name || "Unknown"}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleInvite(member.user_id)}
                  disabled={inviting === member.user_id}
                >
                  {inviting === member.user_id ? "Inviting..." : "Invite"}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
