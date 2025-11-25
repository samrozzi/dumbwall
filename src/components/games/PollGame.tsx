import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PollMetadata } from "@/types/games";
import { Progress } from "@/components/ui/progress";

interface PollGameProps {
  gameId: string;
  title: string | null;
  metadata: PollMetadata;
  userVotes?: string[];
  onVote: (optionIds: string[]) => void;
  isFinished: boolean;
}

export const PollGame = ({ 
  gameId, 
  title, 
  metadata, 
  userVotes = [],
  onVote, 
  isFinished 
}: PollGameProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(userVotes);
  
  const totalVotes = metadata.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  
  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote(selectedOptions);
    }
  };

  const hasVoted = userVotes.length > 0;

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{title || "Poll"}</CardTitle>
        {metadata.closesAt && (
          <p className="text-sm text-muted-foreground">
            Closes: {new Date(metadata.closesAt).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasVoted && !isFinished ? (
          <>
            {metadata.allowMultiple ? (
              <div className="space-y-3">
                {metadata.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={(checked) => {
                        setSelectedOptions(prev =>
                          checked
                            ? [...prev, option.id]
                            : prev.filter(id => id !== option.id)
                        );
                      }}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup
                value={selectedOptions[0]}
                onValueChange={(value) => setSelectedOptions([value])}
              >
                {metadata.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="cursor-pointer text-foreground">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            <Button 
              onClick={handleVote} 
              disabled={selectedOptions.length === 0}
              className="w-full"
            >
              Submit Vote
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            {metadata.options.map((option) => {
              const percentage = totalVotes > 0 
                ? (option.voteCount / totalVotes) * 100 
                : 0;
              
              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={userVotes.includes(option.id) ? "font-bold text-foreground" : "text-foreground"}>
                      {option.label}
                    </span>
                    <span className="text-foreground/70 font-medium">
                      {option.voteCount} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground text-center pt-2">
              Total votes: {totalVotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
