import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (prompt: string, category: "photo" | "text" | "activity") => void;
}

const CHALLENGE_TEMPLATES = [
  { prompt: "Post your morning face 🌅", category: "photo" as const },
  { prompt: "What's one thing that happened today? 📝", category: "text" as const },
  { prompt: "Show your pet, NOW 🐾", category: "photo" as const },
  { prompt: "Screenshot your weather app ☀️", category: "photo" as const },
  { prompt: "Share your current vibe in 3 emojis", category: "text" as const },
  { prompt: "What's playing on your headphones? 🎧", category: "text" as const },
  { prompt: "Post a photo of your view right now 🌄", category: "photo" as const },
  { prompt: "Share what you're grateful for today 🙏", category: "text" as const },
];

export const CreateChallengeDialog = ({ open, onOpenChange, onCreate }: CreateChallengeDialogProps) => {
  const handleSelect = (template: typeof CHALLENGE_TEMPLATES[0]) => {
    onCreate(template.prompt, template.category);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Challenge</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {CHALLENGE_TEMPLATES.map((template, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleSelect(template)}
            >
              <p className="font-medium text-center">{template.prompt}</p>
              <p className="text-xs text-muted-foreground text-center mt-1 capitalize">
                {template.category}
              </p>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
