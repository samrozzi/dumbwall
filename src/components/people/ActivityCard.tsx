import { StoryAvatar } from "./StoryAvatar";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Trophy, MessageCircle, Users } from "lucide-react";
import { AudioClip } from "@/components/wall/AudioClip";
import StickyNote from "@/components/wall/StickyNote";
import ImageCard from "@/components/wall/ImageCard";
import { QuickPoll } from "@/components/wall/QuickPoll";
import { MusicDrop } from "@/components/wall/MusicDrop";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { ActivityInteractions } from "./ActivityInteractions";

interface ActivityCardProps {
  activity: {
    id: string;
    user_id: string;
    activity_type: string;
    reference_id: string | null;
    reference_type: string | null;
    metadata: any;
    created_at: string;
    circle_id: string;
    profiles?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    wall_items?: {
      id: string;
      type: string;
      content: any;
      created_by: string;
      x: number;
      y: number;
      z_index: number;
    };
  };
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const getActionText = () => {
    switch (activity.activity_type) {
      case "wall_post":
        const itemType = activity.metadata?.item_type || "item";
        return `posted a ${itemType.replace("_", " ")}`;
      case "game_win":
        return "won a game";
      case "status_change":
        return "updated status";
      case "thread_join":
        return "joined a thread";
      case "poll_create":
        return "created a poll";
      case "story_add":
        return "added to story";
      case "member_join":
        return "joined the circle";
      default:
        return "activity";
    }
  };

  const getIcon = () => {
    switch (activity.activity_type) {
      case "game_win":
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "thread_join":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "member_join":
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (activity.reference_type !== 'wall_item' || !activity.wall_items) {
      return <p className="text-sm text-foreground/70">{getActionText()}</p>;
    }

    const wallItem = activity.wall_items;
    
    switch (wallItem.type) {
      case 'audio':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <AudioClip 
              content={wallItem.content} 
              fullWidth 
            />
          </div>
        );
        
      case 'note':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <StickyNote 
              content={wallItem.content}
              fullWidth
              hideAvatar
            />
          </div>
        );
        
      case 'image':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <div className="max-h-[320px] overflow-hidden rounded-lg">
              <ImageCard 
                id={wallItem.id}
                content={wallItem.content}
                fullWidth
                hideAvatar
                currentUserId={currentUserId || undefined}
              />
            </div>
            <ActivityInteractions 
              wallItemId={wallItem.id}
              currentUserId={currentUserId || undefined}
            />
          </div>
        );
        
      case 'poll':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <QuickPoll 
              content={wallItem.content}
              itemId={wallItem.id}
              currentUserId={currentUserId || undefined}
              fullWidth
            />
          </div>
        );
        
      case 'music':
        return (
          <div className="mt-3">
            <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>
            <MusicDrop 
              content={wallItem.content}
              fullWidth
            />
          </div>
        );
        
      default:
        return <p className="text-sm text-foreground/70">{getActionText()}</p>;
    }
  };

  return (
    <div className="relative bg-white/[0.02] backdrop-blur-[18px] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors max-w-2xl">
      <div className="flex gap-3">
        {/* Avatar */}
        <StoryAvatar
          src={activity.profiles?.avatar_url}
          alt={activity.profiles?.display_name || activity.profiles?.username || "User"}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {activity.profiles?.display_name || activity.profiles?.username || "User"}
            </span>
            {getIcon()}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Interactive Content */}
          {renderContent()}
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
};
