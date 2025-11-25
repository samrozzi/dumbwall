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
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-10 h-2.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* New Story Button */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setCreatorOpen(true)}
            className="relative w-12 h-12 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center border-2 border-dashed border-border"
          >
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-[10px] text-muted-foreground max-w-[48px] truncate">New</span>
        </div>

        {/* User Stories */}
        {storyGroups.map((group: any, index: number) => (
          <div
            key={group.user_id}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <StoryAvatar
              src={group.profiles?.avatar_url}
              alt={group.profiles?.display_name || group.profiles?.username || "User"}
              size="md"
              hasUnviewedStory={true}
              onClick={() => handleStoryClick(index)}
            />
            <span className="text-[10px] text-foreground max-w-[48px] truncate">
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
