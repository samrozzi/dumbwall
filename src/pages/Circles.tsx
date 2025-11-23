import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, LogOut, Sparkles, Check, X, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InviteAcceptDialog } from "@/components/InviteAcceptDialog";

interface Circle {
  id: string;
  name: string;
  created_at: string;
}

interface PendingInvite {
  id: string;
  circle_id: string;
  circles: {
    name: string;
  };
  profiles: {
    display_name: string | null;
  };
}

const Circles = () => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [newCircleName, setNewCircleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvite | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadCircles();
    loadPendingInvites();
  }, [user, navigate]);

  const loadCircles = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("circle_members")
        .select("circle_id")
        .eq("user_id", user?.id);

      if (memberError) throw memberError;

      const circleIds = memberData?.map((m) => m.circle_id) || [];

      if (circleIds.length === 0) {
        setCircles([]);
        setLoading(false);
        return;
      }

      const { data: circlesData, error: circlesError } = await supabase
        .from("circles")
        .select("*")
        .in("id", circleIds)
        .order("created_at", { ascending: false });

      if (circlesError) throw circlesError;
      setCircles(circlesData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from("circle_invites")
        .select(`
          id,
          circle_id,
          circles!circle_invites_circle_id_fkey(name),
          profiles!circle_invites_invited_by_fkey(display_name)
        `)
        .eq("status", "pending");

      if (error) throw error;

      setPendingInvites(data as any || []);
    } catch (error: any) {
      console.error("Error loading pending invites:", error);
    }
  };

  const handleAcceptInvite = async (inviteId: string, circleId: string) => {
    if (!user) return;

    try {
      // Add user to circle
      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: "member",
        });

      if (memberError) throw memberError;

      // Update invite status
      const { error: updateError } = await supabase
        .from("circle_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId);

      if (updateError) throw updateError;

      toast.success("You've joined the circle!");
      loadCircles();
      loadPendingInvites();
    } catch (error: any) {
      toast.error("Failed to accept invite: " + error.message);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("circle_invites")
        .update({ status: "rejected" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Invite declined");
      loadPendingInvites();
    } catch (error: any) {
      toast.error("Failed to decline invite: " + error.message);
    }
  };

  const createCircle = async () => {
    if (!newCircleName.trim()) {
      toast.error("Please enter a circle name");
      return;
    }

    setCreating(true);
    try {
      const { data: circle, error: circleError } = await supabase
        .from("circles")
        .insert({ name: newCircleName, created_by: user?.id })
        .select()
        .single();

      if (circleError) throw circleError;

      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({
          circle_id: circle.id,
          user_id: user?.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast.success("Circle created!");
      setNewCircleName("");
      setOpen(false);
      loadCircles();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Your Circles
            </h1>
          </div>
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Pending Invite Circles */}
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => {
                setSelectedInvite(invite);
                setIsInviteDialogOpen(true);
              }}
            >
              <div className="relative w-48 h-48 rounded-full border-dashed border-4 border-primary/40 bg-primary/5 shadow-lg hover:scale-105 transition-all flex flex-col items-center justify-center mb-3 opacity-80 animate-pulse">
                <Mail className="w-10 h-10 text-primary mb-2" />
                <div className="text-center px-4">
                  <h3 className="text-lg font-semibold mb-1">{invite.circles.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Tap to view
                  </p>
                </div>
                <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-ping" />
              </div>
            </div>
          ))}

          {/* Regular Circles */}
          {circles.map((circle) => (
            <div
              key={circle.id}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => navigate(`/circle/${circle.id}/wall`)}
            >
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border-8 border-white shadow-[0_0_0_6px_black] hover:rotate-1 transition-all hover:scale-105 flex items-center justify-center mb-3">
                <h3 className="text-xl font-semibold text-center px-6">{circle.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(circle.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <div className="flex flex-col items-center cursor-pointer group">
                <div className="relative w-48 h-48 rounded-full border-dashed border-4 border-primary/50 hover:border-primary transition-all hover:scale-105 flex items-center justify-center mb-3 hover:bg-primary/10">
                  <div className="text-center">
                    <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold text-primary">New Circle</p>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create a New Circle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="circleName">Circle Name</Label>
                  <Input
                    id="circleName"
                    value={newCircleName}
                    onChange={(e) => setNewCircleName(e.target.value)}
                    placeholder="My awesome circle"
                    className="mt-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createCircle();
                    }}
                  />
                </div>
                <Button
                  onClick={createCircle}
                  disabled={creating}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {creating ? "Creating..." : "Create Circle"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <InviteAcceptDialog
          invite={selectedInvite}
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      </div>
    </div>
  );
};

export default Circles;
