import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Comment {
  id: string;
  comment_text: string;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  reacted_by_me: boolean;
}

interface VoteCounts {
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
}

export const usePhotoInteractions = (wallItemId: string, currentUserId?: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [votes, setVotes] = useState<VoteCounts>({ upvotes: 0, downvotes: 0, user_vote: null });
  const [loading, setLoading] = useState(true);

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('wall_item_comments')
      .select('id, comment_text, user_id, created_at')
      .eq('wall_item_id', wallItemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments:', error);
      return;
    }

    // Load profiles separately
    const userIds = [...new Set(data?.map(c => c.user_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    const commentsWithProfiles = data?.map(comment => ({
      ...comment,
      profiles: profilesData?.find(p => p.id === comment.user_id),
    })) || [];

    setComments(commentsWithProfiles as Comment[]);
  };

  const loadReactions = async () => {
    const { data, error } = await supabase
      .from('wall_item_reactions')
      .select('emoji, user_id')
      .eq('wall_item_id', wallItemId);

    if (error) {
      console.error('Error loading reactions:', error);
      return;
    }

    const grouped = data?.reduce((acc, reaction) => {
      const existing = acc.find(r => r.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reaction.user_id);
        if (reaction.user_id === currentUserId) {
          existing.reacted_by_me = true;
        }
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.user_id],
          reacted_by_me: reaction.user_id === currentUserId,
        });
      }
      return acc;
    }, [] as Reaction[]) || [];

    setReactions(grouped);
  };

  const loadVotes = async () => {
    const { data, error } = await supabase
      .from('wall_item_votes')
      .select('vote_type, user_id')
      .eq('wall_item_id', wallItemId);

    if (error) {
      console.error('Error loading votes:', error);
      return;
    }

    const upvotes = data?.filter(v => v.vote_type === 'up').length || 0;
    const downvotes = data?.filter(v => v.vote_type === 'down').length || 0;
    const userVote = data?.find(v => v.user_id === currentUserId)?.vote_type as 'up' | 'down' | undefined;

    setVotes({ upvotes, downvotes, user_vote: userVote || null });
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadComments(), loadReactions(), loadVotes()]);
      setLoading(false);
    };

    loadAll();

    // Subscribe to realtime updates
    const commentsChannel = supabase
      .channel(`wall_item_comments:${wallItemId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wall_item_comments',
        filter: `wall_item_id=eq.${wallItemId}`
      }, () => loadComments())
      .subscribe();

    const reactionsChannel = supabase
      .channel(`wall_item_reactions:${wallItemId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wall_item_reactions',
        filter: `wall_item_id=eq.${wallItemId}`
      }, () => loadReactions())
      .subscribe();

    const votesChannel = supabase
      .channel(`wall_item_votes:${wallItemId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wall_item_votes',
        filter: `wall_item_id=eq.${wallItemId}`
      }, () => loadVotes())
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [wallItemId, currentUserId]);

  const addComment = async (commentText: string) => {
    if (!currentUserId || !commentText.trim()) return;

    const { error } = await supabase
      .from('wall_item_comments')
      .insert({
        wall_item_id: wallItemId,
        user_id: currentUserId,
        comment_text: commentText.trim(),
      });

    if (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!currentUserId) return;

    const existing = reactions.find(r => r.emoji === emoji && r.reacted_by_me);

    if (existing) {
      const { error } = await supabase
        .from('wall_item_reactions')
        .delete()
        .eq('wall_item_id', wallItemId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing reaction:', error);
        toast.error('Failed to remove reaction');
      }
    } else {
      const { error } = await supabase
        .from('wall_item_reactions')
        .insert({
          wall_item_id: wallItemId,
          user_id: currentUserId,
          emoji,
        });

      if (error) {
        console.error('Error adding reaction:', error);
        toast.error('Failed to add reaction');
      }
    }
  };

  const toggleVote = async (voteType: 'up' | 'down') => {
    if (!currentUserId) return;

    if (votes.user_vote === voteType) {
      // Remove vote
      const { error } = await supabase
        .from('wall_item_votes')
        .delete()
        .eq('wall_item_id', wallItemId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error removing vote:', error);
        toast.error('Failed to remove vote');
      }
    } else if (votes.user_vote) {
      // Update existing vote
      const { error } = await supabase
        .from('wall_item_votes')
        .update({ vote_type: voteType })
        .eq('wall_item_id', wallItemId)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('Error updating vote:', error);
        toast.error('Failed to update vote');
      }
    } else {
      // Add new vote
      const { error } = await supabase
        .from('wall_item_votes')
        .insert({
          wall_item_id: wallItemId,
          user_id: currentUserId,
          vote_type: voteType,
        });

      if (error) {
        console.error('Error adding vote:', error);
        toast.error('Failed to add vote');
      }
    }
  };

  return {
    comments,
    reactions,
    votes,
    loading,
    addComment,
    toggleReaction,
    toggleVote,
  };
};
