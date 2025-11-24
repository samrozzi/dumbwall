import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const usePresenceTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", user.id);
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    // Update immediately on mount
    updatePresence();

    // Set up interval for heartbeat
    const interval = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Update on user activity
    const handleActivity = () => {
      updatePresence();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [user]);
};
