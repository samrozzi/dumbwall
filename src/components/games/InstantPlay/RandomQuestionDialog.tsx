import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameAPI } from "@/hooks/useGameAPI";
import { toast } from "sonner";

interface RandomQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
}

const randomQuestions = [
  "If you could have dinner with anyone, living or dead, who would it be?",
  "What's your hidden talent?",
  "What's the best advice you've ever received?",
  "If you could live anywhere in the world, where would it be?",
  "What's your go-to comfort food?",
  "What song is stuck in your head right now?",
  "What's your favorite childhood memory?",
  "If you could learn any skill instantly, what would it be?",
  "What's the most spontaneous thing you've ever done?",
  "What's your dream vacation destination?",
];

export const RandomQuestionDialog = ({ open, onOpenChange, circleId }: RandomQuestionDialogProps) => {
  const navigate = useNavigate();
  const { createGame } = useGameAPI();
  const [creating, setCreating] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(
    randomQuestions[Math.floor(Math.random() * randomQuestions.length)]
  );

  const rollNewQuestion = () => {
    setCurrentQuestion(randomQuestions[Math.floor(Math.random() * randomQuestions.length)]);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const metadata = {
        question: currentQuestion,
        responses: [],
      };

      const gameId = await createGame(circleId, "question_of_the_day", currentQuestion, "Random question for the circle!", metadata, "in_progress");
      toast.success("Question posted!");
      onOpenChange(false);
      navigate(`/circle/${circleId}/games`);
    } catch (error) {
      console.error("Failed to create question:", error);
      toast.error("Failed to create question");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5" />
            Random Question
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">{currentQuestion}</p>
          </div>
          <Button variant="outline" onClick={rollNewQuestion} className="w-full">
            <Dices className="w-4 h-4 mr-2" />
            Roll New Question
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating} className="flex-1">
              {creating ? "Creating..." : "Ask Circle"}
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
