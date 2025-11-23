import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Hand } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameAPI } from "@/hooks/useGameAPI";
import { toast } from "sonner";

interface RockPaperScissorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
}

export const RockPaperScissorsDialog = ({ open, onOpenChange, circleId }: RockPaperScissorsDialogProps) => {
  const navigate = useNavigate();
  const { createGame } = useGameAPI();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const metadata = {
        options: [
          { id: "rock", label: "🪨 Rock", voteCount: 0 },
          { id: "paper", label: "📄 Paper", voteCount: 0 },
          { id: "scissors", label: "✂️ Scissors", voteCount: 0 },
        ],
        allowMultiple: false,
      };

      const gameId = await createGame(circleId, "poll", "Rock, Paper, Scissors!", "Quick game - make your choice!", metadata, "in_progress");
      toast.success("Game created!");
      onOpenChange(false);
      navigate(`/games/${circleId}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      toast.error("Failed to create game");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hand className="w-5 h-5" />
            Rock, Paper, Scissors
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Challenge your circle to a quick game of Rock, Paper, Scissors!
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating} className="flex-1">
              {creating ? "Creating..." : "Start Game"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
