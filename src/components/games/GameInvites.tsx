import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { notify } from "@/components/ui/custom-notification";
import { X, Check } from "lucide-react";

interface GameInvite {
  id: string;
  game_id: string;
  invited_by: string;
  games: {
    title: string | null;
    type: string;
    circle_id: string;
  };
  profiles: {
    display_name: string | null;
  };
}

export const GameInvites = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<GameInvite[]>([]);

  useEffect(() => {
    if (!user) return;

    loadInvites();
    setupRealtime();
  }, [user]);

  const loadInvites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("game_invites")
      .select(`
        id,
        game_id,
        invited_by,
        invited_user_id,
        status,
        games!inner(
          title,
          type,
          circle_id
        ),
        profiles!game_invites_invited_by_fkey(
          display_name
        )
      `)
      .eq("invited_user_id", user.id)
      .eq("status", "pending");

    console.log('Loaded invites:', data);
    if (error) console.error('Invite load error:', error);

    if (data) {
      setInvites(data as any);
    }
  };

  const setupRealtime = () => {
    if (!user) return;

    const channel = supabase
      .channel("game_invites")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_invites",
          filter: `invited_user_id=eq.${user.id}`,
        },
        () => {
          loadInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAccept = async (inviteId: string, gameId: string, circleId: string) => {
    if (!user) return;

    try {
      // Join the game
      await supabase.from("game_participants").insert({
        game_id: gameId,
        user_id: user.id,
        role: "player",
      });

      // Update invite status
      await supabase
        .from("game_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId);

      notify("Joined game!");
      loadInvites();
    } catch (error) {
      console.error("Error accepting invite:", error);
      notify("Failed to join game");
    }
  };

  const handleDecline = async (inviteId: string) => {
    try {
      await supabase
        .from("game_invites")
        .update({ status: "declined" })
        .eq("id", inviteId);

      notify("Invite declined");
      loadInvites();
    } catch (error) {
      console.error("Error declining invite:", error);
      notify("Failed to decline invite");
    }
  };

  if (invites.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Game Invitations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-accent/50"
          >
            <div>
              <p className="font-medium">
                {invite.games.title || invite.games.type}
              </p>
              <p className="text-sm text-muted-foreground">
                from {invite.profiles?.display_name || "Someone"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleAccept(invite.id, invite.game_id, invite.games.circle_id)}
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDecline(invite.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
