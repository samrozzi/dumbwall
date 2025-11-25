import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  circle_id: string;
  user_id: string;
  activity_type: string;
  reference_id: string | null;
  reference_type: string | null;
  metadata: any;
  created_at: string;
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
  } | null;
}

export const useActivities = (circleId: string, limit: number = 20) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadActivities();

    // Subscribe to real-time activity updates
    const channel = supabase
      .channel(`activities-${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "circle_activities",
          filter: `circle_id=eq.${circleId}`,
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId]);

  const loadActivities = async (offset: number = 0) => {
    try {
      const { data, error } = await supabase
        .from("circle_activities")
        .select(`
          *,
          profiles!circle_activities_user_id_fkey(username, display_name, avatar_url)
        `)
        .eq("circle_id", circleId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Fetch wall items separately for activities that reference them
      const activitiesWithWallItems = await Promise.all(
        (data || []).map(async (activity) => {
          if (activity.reference_type === 'wall_item' && activity.reference_id) {
            const { data: wallItemData } = await supabase
              .from("wall_items")
              .select("id, type, content, created_by, x, y, z_index")
              .eq("id", activity.reference_id)
              .single();
            
            return { ...activity, wall_items: wallItemData };
          }
          return activity;
        })
      );

      if (offset === 0) {
        setActivities(activitiesWithWallItems || []);
      } else {
        setActivities((prev) => [...prev, ...(activitiesWithWallItems || [])]);
      }

      setHasMore((data || []).length === limit);
    } catch (error: any) {
      console.error("Error loading activities:", error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadActivities(activities.length);
    }
  };

  return { activities, loading, hasMore, loadMore, refresh: loadActivities };
};
