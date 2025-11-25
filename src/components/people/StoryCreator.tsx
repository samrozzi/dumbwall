import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useStories } from "@/hooks/useStories";
import { ImagePlus, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoryCreatorProps {
  open: boolean;
  onClose: () => void;
  circleId: string;
}

export const StoryCreator = ({ open, onClose, circleId }: StoryCreatorProps) => {
  const [mode, setMode] = useState<"select" | "text" | "image">("select");
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const { createStory } = useStories(circleId);
  const { toast } = useToast();

  const handleTextStory = async () => {
    if (!text.trim()) return;
    
    await createStory("text", { text });
    setText("");
    onClose();
    setMode("select");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${circleId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(filePath);

      await createStory("image", { image_url: publicUrl });
      onClose();
      setMode("select");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Story</DialogTitle>
        </DialogHeader>

        {mode === "select" && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => setMode("text")}
            >
              <Type className="w-8 h-8" />
              <span>Text</span>
            </Button>

            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => setMode("image")}
            >
              <ImagePlus className="w-8 h-8" />
              <span>Image</span>
            </Button>
          </div>
        )}

        {mode === "text" && (
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setMode("select")}>
                Back
              </Button>
              <Button onClick={handleTextStory} disabled={!text.trim()}>
                Post Story
              </Button>
            </div>
          </div>
        )}

        {mode === "image" && (
          <div className="py-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
              id="story-image-upload"
            />
            <label htmlFor="story-image-upload">
              <Button
                variant="outline"
                className="w-full h-32"
                disabled={uploading}
                asChild
              >
                <div>
                  <ImagePlus className="w-8 h-8 mr-2" />
                  {uploading ? "Uploading..." : "Choose Image"}
                </div>
              </Button>
            </label>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setMode("select")}
            >
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
