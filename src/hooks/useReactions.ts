import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  reacted_by_me: boolean;
}

export const useReactions = (messageId: string, currentUserId: string | undefined) => {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadReactions = async () => {
    if (!messageId) return;

    const { data, error } = await supabase
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (error) {
      console.error('Error loading reactions:', error);
      return;
    }

    // Group reactions by emoji
    const grouped = data.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          reacted_by_me: false,
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user_id);
      if (reaction.user_id === currentUserId) {
        acc[reaction.emoji].reacted_by_me = true;
      }
      return acc;
    }, {} as Record<string, MessageReaction>);

    setReactions(Object.values(grouped));
  };

  const toggleReaction = async (emoji: string) => {
    if (!currentUserId || loading) return;
    
    setLoading(true);

    const existingReaction = reactions.find(
      (r) => r.emoji === emoji && r.reacted_by_me
    );

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove reaction",
          variant: "destructive",
        });
      } else {
        await loadReactions();
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add reaction",
          variant: "destructive",
        });
      } else {
        await loadReactions();
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadReactions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, currentUserId]);

  return { reactions, toggleReaction, loading };
};
