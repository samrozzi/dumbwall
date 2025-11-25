import { useActivities } from "@/hooks/useActivities";
import { ActivityCard } from "./ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityFeedProps {
  circleId: string;
}

export const ActivityFeed = ({ circleId }: ActivityFeedProps) => {
  const { activities, loading, hasMore, loadMore } = useActivities(circleId);

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/[0.02] rounded-2xl p-4">
            <div className="flex gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No activity yet. Be the first to post something!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-3 pb-32">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}

        {hasMore && (
          <Button
            variant="outline"
            onClick={loadMore}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        )}
      </div>
    </ScrollArea>
  );
};
