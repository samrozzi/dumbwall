import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameAPI } from "@/hooks/useGameAPI";
import { toast } from "sonner";

interface CoinFlipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
}

export const CoinFlipDialog = ({ open, onOpenChange, circleId }: CoinFlipDialogProps) => {
  const navigate = useNavigate();
  const { createGame } = useGameAPI();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const metadata = {
        options: [
          { id: "heads", label: "Heads", voteCount: 0 },
          { id: "tails", label: "Tails", voteCount: 0 },
        ],
        allowMultiple: false,
      };

      const gameId = await createGame(circleId, "poll", "Coin Flip", "Call it - heads or tails?", metadata, "in_progress");
      toast.success("Coin flip created!");
      onOpenChange(false);
      navigate(`/circle/${circleId}/games`);
    } catch (error) {
      console.error("Failed to create coin flip:", error);
      toast.error("Failed to create coin flip");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Coin Flip
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Let fate decide! Create a quick coin flip for your circle.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating} className="flex-1">
              {creating ? "Creating..." : "Flip Coin"}
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
