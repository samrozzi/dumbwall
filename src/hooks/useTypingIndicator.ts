import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const useTypingIndicator = (threadId: string | null, currentUserId: string | undefined) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingUpdateRef = useRef<number>(0);

  // Listen to typing indicators from other users
  useEffect(() => {
    if (!threadId || !currentUserId) return;

    const fetchTypingUsers = async () => {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('user_id')
        .eq('thread_id', threadId)
        .neq('user_id', currentUserId)
        .gt('expires_at', new Date().toISOString());

      if (error || !data) {
        setTypingUsers([]);
        return;
      }

      // Fetch user profiles for typing users
      const userIds = data.map(t => t.user_id);
      if (userIds.length === 0) {
        setTypingUsers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        setTypingUsers(
          profiles.map(p => ({
            user_id: p.id,
            username: p.username || 'Unknown',
            display_name: p.display_name,
            avatar_url: p.avatar_url
          }))
        );
      }
    };

    // Initial fetch
    fetchTypingUsers();

    // Subscribe to typing indicator changes
    const channel = supabase
      .channel(`typing:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          fetchTypingUsers();
        }
      )
      .subscribe();

    // Cleanup expired indicators every 2 seconds
    const cleanupInterval = setInterval(fetchTypingUsers, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [threadId, currentUserId]);

  // Send typing indicator
  const sendTypingIndicator = async () => {
    if (!threadId || !currentUserId) return;

    const now = Date.now();
    // Throttle: only send update every 3 seconds
    if (now - lastTypingUpdateRef.current < 3000) return;

    lastTypingUpdateRef.current = now;

    const expiresAt = new Date(Date.now() + 10000).toISOString(); // 10 seconds

    await supabase
      .from('typing_indicators')
      .upsert(
        {
          thread_id: threadId,
          user_id: currentUserId,
          expires_at: expiresAt,
          started_at: new Date().toISOString()
        },
        {
          onConflict: 'thread_id,user_id'
        }
      );
  };

  // Stop typing indicator
  const stopTypingIndicator = async () => {
    if (!threadId || !currentUserId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await supabase
      .from('typing_indicators')
      .delete()
      .eq('thread_id', threadId)
      .eq('user_id', currentUserId);
  };

  // Handle input change (call this when user types)
  const handleTyping = () => {
    sendTypingIndicator();

    // Auto-clear typing indicator after 10 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 10000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTypingIndicator();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [threadId, currentUserId]);

  return {
    typingUsers,
    handleTyping,
    stopTypingIndicator
  };
};
