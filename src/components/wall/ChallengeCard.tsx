import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface ChallengeResponse {
  userId: string;
  imageUrl?: string;
  text?: string;
}

interface ChallengeCardProps {
  content: {
    prompt: string;
    category: "photo" | "text" | "activity";
    responses: ChallengeResponse[];
    expiresAt?: string;
  };
  onRespond: () => void;
}

export const ChallengeCard = ({ content, onRespond }: ChallengeCardProps) => {
  const isExpired = content.expiresAt && new Date(content.expiresAt) < new Date();

  return (
    <Card className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-2 border-rose-200 dark:border-rose-800 w-[320px]">
      <div className="text-center">
        <div className="text-4xl mb-2">⚡</div>
        <h3 className="font-bold text-lg mb-3 text-foreground">{content.prompt}</h3>
        
        {!isExpired && (
          <Button
            onClick={onRespond}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white mb-3"
          >
            Respond to Challenge
          </Button>
        )}

        {content.responses.length > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {content.responses.length} response{content.responses.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {isExpired && (
          <p className="text-xs text-muted-foreground mt-2">Challenge expired</p>
        )}
      </div>
    </Card>
  );
};
