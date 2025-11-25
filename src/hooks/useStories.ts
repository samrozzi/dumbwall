import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Story {
  id: string;
  circle_id: string;
  user_id: string;
  type: string;
  content: any;
  created_at: string;
  expires_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useStories = (circleId: string) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStories();

    // Subscribe to real-time story updates
    const channel = supabase
      .channel(`stories-${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "circle_stories",
          filter: `circle_id=eq.${circleId}`,
        },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId]);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from("circle_stories")
        .select("*")
        .eq("circle_id", circleId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const storiesWithProfiles = await Promise.all(
        (data || []).map(async (story) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", story.user_id)
            .single();
          
          return { ...story, profiles: profileData };
        })
      );

      setStories(storiesWithProfiles || []);
    } catch (error: any) {
      console.error("Error loading stories:", error);
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (type: string, content: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("circle_stories").insert({
        circle_id: circleId,
        user_id: user.id,
        type,
        content,
      });

      if (error) throw error;

      toast({
        title: "Story added",
        description: "Your story has been posted",
      });
    } catch (error: any) {
      console.error("Error creating story:", error);
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive",
      });
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from("circle_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting story:", error);
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      });
    }
  };

  return { stories, loading, createStory, deleteStory, refresh: loadStories };
};
