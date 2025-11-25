import { StoryAvatar } from "./StoryAvatar";
import { useStories } from "@/hooks/useStories";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useState } from "react";
import { StoryCreator } from "./StoryCreator";
import { StoryViewer } from "./StoryViewer";

interface StoriesRowProps {
  circleId: string;
}

export const StoriesRow = ({ circleId }: StoriesRowProps) => {
  const { stories, loading } = useStories(circleId);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Group stories by user
  const groupedStories = stories.reduce((acc: any, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = {
        user_id: story.user_id,
        profiles: story.profiles,
        stories: [],
      };
    }
    acc[story.user_id].stories.push(story);
    return acc;
  }, {});

  const storyGroups = Object.values(groupedStories);

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-12 h-3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {/* New Story Button */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setCreatorOpen(true)}
            className="relative w-16 h-16 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center border-2 border-dashed border-border"
          >
            <Plus className="w-6 h-6" />
          </button>
          <span className="text-xs text-muted-foreground">New Story</span>
        </div>

        {/* User Stories */}
        {storyGroups.map((group: any, index: number) => (
          <div
            key={group.user_id}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <StoryAvatar
              src={group.profiles?.avatar_url}
              alt={group.profiles?.display_name || group.profiles?.username || "User"}
              size="lg"
              hasUnviewedStory={true}
              onClick={() => handleStoryClick(index)}
            />
            <span className="text-xs text-foreground max-w-[64px] truncate">
              {group.profiles?.display_name || group.profiles?.username || "User"}
            </span>
          </div>
        ))}
      </div>

      <StoryCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        circleId={circleId}
      />

      <StoryViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        storyGroups={storyGroups}
        initialGroupIndex={selectedStoryIndex}
      />
    </>
  );
};
