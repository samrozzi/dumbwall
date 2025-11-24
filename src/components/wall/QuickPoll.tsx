import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface QuickPollProps {
  content: {
    question: string;
    options: PollOption[];
  };
  itemId: string;
  currentUserId?: string;
  onDelete?: () => void;
  isCreator?: boolean;
  fullWidth?: boolean;
}

export const QuickPoll = ({ content, itemId, currentUserId, onDelete, isCreator, fullWidth }: QuickPollProps) => {
  const { toast } = useToast();
  const [voting, setVoting] = useState(false);

  const totalVotes = content.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const hasVoted = content.options.some(opt => opt.votes.includes(currentUserId || ""));

  const handleVote = async (optionId: string) => {
    if (!currentUserId || voting) return;

    setVoting(true);
    try {
      // Update votes
      const updatedOptions = content.options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes: [...opt.votes.filter(v => v !== currentUserId), currentUserId] };
        }
        return { ...opt, votes: opt.votes.filter(v => v !== currentUserId) };
      });

      const { error } = await supabase
        .from("wall_items")
        .update({ content: { ...content, options: updatedOptions } })
        .eq("id", itemId);

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      });
    } finally {
      setVoting(false);
    }
  };

  return (
    <Card className={`p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-2 border-pink-200 dark:border-pink-800 ${fullWidth ? 'w-full max-w-full' : 'w-[280px] max-w-full'} relative`}>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-black hover:bg-white/90 dark:hover:bg-black/90 flex items-center justify-center transition-colors z-10 shadow-md"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}
      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">{content.question}</h3>
      <div className="space-y-2">
        {content.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
          const voted = option.votes.includes(currentUserId || "");

          return (
            <Button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={voting}
              variant="outline"
              className="w-full relative overflow-hidden h-auto py-3 px-4 text-left justify-start bg-white/90 dark:bg-gray-800/90 border-pink-300 dark:border-pink-700"
            >
              {hasVoted && (
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-300 to-purple-300 dark:from-pink-700 dark:to-purple-700 transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="font-medium text-gray-900 dark:text-white">{option.text}</span>
                <div className="flex items-center gap-2">
                  {hasVoted && <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>}
                  {voted && <Check className="w-4 h-4" />}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
      {totalVotes > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </p>
      )}
    </Card>
  );
};
