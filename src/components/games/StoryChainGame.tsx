import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StoryChainMetadata } from "@/types/games";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StoryChainGameProps {
  gameId: string;
  title: string | null;
  metadata: StoryChainMetadata;
  userId: string;
  onAddPart: (text: string) => void;
  isFinished: boolean;
}

export const StoryChainGame = ({
  gameId,
  title,
  metadata,
  userId,
  onAddPart,
  isFinished,
}: StoryChainGameProps) => {
  const [storyPart, setStoryPart] = useState("");
  const lastContributor = metadata.storyParts[metadata.storyParts.length - 1]?.userId;
  const canContribute = lastContributor !== userId && !isFinished;

  const handleSubmit = () => {
    if (storyPart.trim()) {
      onAddPart(storyPart);
      setStoryPart("");
    }
  };

  const fullStory = metadata.storyParts.map(part => part.text).join(" ");

  return (
    <Card className="w-96 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">
          {title || "Story Chain"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Max {metadata.maxCharacters} characters per part
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <ScrollArea className="h-32">
            <p className="text-sm leading-relaxed">
              {fullStory || "The story begins here..."}
            </p>
          </ScrollArea>
        </div>

        {metadata.storyParts.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Latest by: {metadata.storyParts[metadata.storyParts.length - 1].userId.slice(0, 8)}...
          </div>
        )}

        {canContribute ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Add your part:</span>
              <span className={storyPart.length > metadata.maxCharacters ? "text-destructive" : "text-muted-foreground"}>
                {storyPart.length}/{metadata.maxCharacters}
              </span>
            </div>
            <Textarea
              placeholder="Continue the story..."
              value={storyPart}
              onChange={(e) => setStoryPart(e.target.value)}
              maxLength={metadata.maxCharacters}
              className="min-h-20"
            />
            <Button 
              onClick={handleSubmit} 
              disabled={!storyPart.trim() || storyPart.length > metadata.maxCharacters}
              className="w-full"
            >
              Add to Story
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-2">
            {isFinished 
              ? "Story complete!" 
              : "Wait for someone else to add to the story"}
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground">
          {metadata.storyParts.length} parts so far
        </div>
      </CardContent>
    </Card>
  );
};
