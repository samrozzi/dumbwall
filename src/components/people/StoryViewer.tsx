import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryAvatar } from "./StoryAvatar";
import { formatDistanceToNow } from "date-fns";

interface StoryViewerProps {
  open: boolean;
  onClose: () => void;
  storyGroups: any[];
  initialGroupIndex: number;
}

export const StoryViewer = ({
  open,
  onClose,
  storyGroups,
  initialGroupIndex,
}: StoryViewerProps) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    setGroupIndex(initialGroupIndex);
    setStoryIndex(0);
  }, [initialGroupIndex, open]);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const goToPrevious = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setStoryIndex(storyGroups[groupIndex - 1].stories.length - 1);
    }
  };

  const goToNext = () => {
    if (currentGroup && storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (!open || !currentStory) return;

    const timer = setTimeout(() => {
      goToNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [open, groupIndex, storyIndex]);

  if (!currentGroup || !currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md h-[80vh] p-0 overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
          {currentGroup.stories.map((_: any, i: number) => (
            <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all ${
                  i < storyIndex
                    ? "w-full"
                    : i === storyIndex
                    ? "w-full animate-progress"
                    : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StoryAvatar
              src={currentGroup.profile?.avatar_url}
              alt={currentGroup.profile?.display_name || "User"}
              size="sm"
            />
            <div>
              <p className="text-white font-medium text-sm">
                {currentGroup.profile?.display_name || currentGroup.profile?.username}
              </p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Story content */}
        <div className="w-full h-full bg-black flex items-center justify-center">
          {currentStory.type === "text" && (
            <div className="text-white text-2xl font-medium text-center p-8">
              {currentStory.content.text}
            </div>
          )}
          {currentStory.type === "image" && (
            <img
              src={currentStory.content.image_url}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Navigation */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
          disabled={groupIndex === 0 && storyIndex === 0}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Tap zones for mobile */}
        <div className="absolute inset-0 flex">
          <div className="flex-1" onClick={goToPrevious} />
          <div className="flex-1" onClick={goToNext} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
