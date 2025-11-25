import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useStories } from "@/hooks/useStories";
import { ImagePlus, Type, Camera, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TextStoryEditor } from "./TextStoryEditor";
import CameraCapture from "../wall/CameraCapture";

interface StoryCreatorProps {
  open: boolean;
  onClose: () => void;
  circleId: string;
}

export const StoryCreator = ({ open, onClose, circleId }: StoryCreatorProps) => {
  const [mode, setMode] = useState<"select" | "text" | "image" | "camera">("select");
  const [uploading, setUploading] = useState(false);
  const { createStory } = useStories(circleId);
  const { toast } = useToast();
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  const handleTextStory = async (storyData: any) => {
    await createStory("text", storyData);
    onClose();
    setMode("select");
  };

  const handleImageUpload = async (file: File) => {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
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
          <div className="py-4">
            <TextStoryEditor
              onSave={handleTextStory}
              onBack={() => setMode("select")}
            />
          </div>
        )}

        {mode === "image" && (
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => setMode("camera")}
              >
                <Camera className="w-8 h-8" />
                <span>Take Photo</span>
              </Button>

              <label htmlFor="story-image-upload" className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                  id="story-image-upload"
                />
                <Button
                  variant="outline"
                  className="h-32 w-full flex flex-col gap-2"
                  disabled={uploading}
                  asChild
                >
                  <div>
                    <Upload className="w-8 h-8" />
                    <span>{uploading ? "Uploading..." : "Upload Photo"}</span>
                  </div>
                </Button>
              </label>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMode("select")}
            >
              Back
            </Button>
          </div>
        )}

        {mode === "camera" && (
          <div className="py-4">
            <CameraCapture
              onCapture={handleImageUpload}
              onClose={() => setMode("image")}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
