import { StoryAvatar } from "./StoryAvatar";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Trophy, MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    profile?: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  };
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const navigate = useNavigate();

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

  const handleClick = () => {
    if (activity.reference_type === "wall_item" && activity.reference_id) {
      navigate(`/circle/${activity.circle_id}/wall`);
    }
  };

  return (
    <div
      className="group relative bg-white/[0.02] backdrop-blur-[18px] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <StoryAvatar
          src={activity.profile?.avatar_url}
          alt={activity.profile?.display_name || activity.profile?.username || "User"}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {activity.profile?.display_name || activity.profile?.username || "User"}
            </span>
            {getIcon()}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Action */}
          <p className="text-sm text-foreground/70 mb-2">{getActionText()}</p>

          {/* Preview Content */}
          {activity.activity_type === "wall_post" && activity.metadata?.content && (
            <div className="mt-2">
              {activity.metadata.item_type === "note" && (
                <div className="bg-background/50 rounded-lg px-3 py-2 text-sm">
                  {activity.metadata.content.text?.substring(0, 100)}
                  {activity.metadata.content.text?.length > 100 && "..."}
                </div>
              )}
              {activity.metadata.item_type === "poll" && activity.metadata.content.question && (
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">{activity.metadata.content.question}</p>
                  <div className="space-y-1">
                    {activity.metadata.content.options?.slice(0, 2).map((opt: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/50" style={{ width: "30%" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activity.metadata.item_type === "image" && activity.metadata.content.url && (
                <img
                  src={activity.metadata.content.url}
                  alt="Post"
                  className="rounded-lg w-24 h-24 object-cover"
                />
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </div>
    </div>
  );
};
