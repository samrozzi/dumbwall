import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

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
];

export const CreateChallengeDialog = ({ open, onOpenChange, onCreate }: CreateChallengeDialogProps) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customCategory, setCustomCategory] = useState<"photo" | "text">("text");

  const handleSelect = (template: typeof CHALLENGE_TEMPLATES[0]) => {
    onCreate(template.prompt, template.category);
    onOpenChange(false);
  };

  const handleCreateCustom = () => {
    if (!customPrompt.trim()) return;
    onCreate(customPrompt, customCategory);
    setCustomPrompt("");
    setShowCustom(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{showCustom ? "Create Your Challenge" : "Choose a Challenge"}</DialogTitle>
        </DialogHeader>
        
        {showCustom ? (
          <div className="space-y-4">
            <div>
              <Label>Challenge Prompt</Label>
              <Input
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Show your workspace setup 💻"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Response Type</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={customCategory === "photo" ? "default" : "outline"}
                  onClick={() => setCustomCategory("photo")}
                  className="flex-1"
                >
                  📸 Photo
                </Button>
                <Button
                  variant={customCategory === "text" ? "default" : "outline"}
                  onClick={() => setCustomCategory("text")}
                  className="flex-1"
                >
                  📝 Text
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCustom(false)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCreateCustom} disabled={!customPrompt.trim()} className="flex-1">
                Create
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {CHALLENGE_TEMPLATES.map((template, index) => (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors text-center"
                  onClick={() => handleSelect(template)}
                >
                  <p className="font-medium text-sm">{template.prompt}</p>
                </Card>
              ))}
            </div>
            
            <Button
              onClick={() => setShowCustom(true)}
              variant="outline"
              className="w-full border-2 border-dashed"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Make Your Own
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
