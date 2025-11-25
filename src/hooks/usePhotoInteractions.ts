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
  const [optimisticCommentId, setOptimisticCommentId] = useState<string | null>(null);

  const loadComments = async () => {
    console.log('🔄 Loading comments for wall item:', wallItemId, 'Optimistic ID:', optimisticCommentId);
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

    console.log('📊 Loaded', commentsWithProfiles.length, 'comments from database');

    // Preserve optimistic comment if it hasn't been confirmed yet
    setComments(prev => {
      const optimistic = prev.find(c => c.id === optimisticCommentId);
      if (optimistic && optimisticCommentId) {
        console.log('🔍 Checking for real version of optimistic comment:', optimisticCommentId);
        // Check if real comment exists (matching user + text + recent timestamp)
        const hasRealVersion = commentsWithProfiles.some(c => 
          c.user_id === optimistic.user_id &&
          c.comment_text === optimistic.comment_text &&
          Math.abs(new Date(c.created_at).getTime() - new Date(optimistic.created_at).getTime()) < 5000
        );
        
        if (hasRealVersion) {
          console.log('✅ Real version found, clearing optimistic comment');
          // Real version exists, clear optimistic flag and use database comments
          setOptimisticCommentId(null);
          return commentsWithProfiles as Comment[];
        } else {
          console.log('⏳ Real version not found yet, keeping optimistic comment');
          // Real version not found yet, keep optimistic at end
          return [...commentsWithProfiles.filter(c => c.id !== optimisticCommentId), optimistic] as Comment[];
        }
      }
      return commentsWithProfiles as Comment[];
    });
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
    if (!currentUserId || !commentText.trim()) {
      console.log('⚠️ [addComment] Skipped - missing userId or empty text');
      return;
    }

    console.log('🚀 [addComment] Starting - wallItemId:', wallItemId, 'userId:', currentUserId);
    console.log('💬 [addComment] Comment text:', commentText.substring(0, 50) + (commentText.length > 50 ? '...' : ''));

    // Optimistic update - add comment immediately to UI
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      wall_item_id: wallItemId,
      user_id: currentUserId,
      comment_text: commentText,
      created_at: new Date().toISOString(),
      profiles: {
        username: 'You',
        avatar_url: null
      }
    };
    
    console.log('📝 [addComment] Setting optimistic comment ID:', tempId);
    setOptimisticCommentId(tempId);
    
    setComments(prev => {
      console.log('📊 [addComment] Current comments count:', prev.length, '→ Adding optimistic');
      return [...prev, optimisticComment];
    });

    try {
      console.log('💾 [addComment] Database insert started for wall item:', wallItemId);
      console.log('🔍 [addComment] Checking for existing thread...');
      // Check if thread already exists for this photo
      const { data: existingThread } = await supabase
        .from('chat_threads')
        .select('id, circle_id')
        .eq('linked_wall_item_id', wallItemId)
        .single();

      let threadId = existingThread?.id;

      console.log('🔍 [addComment] Thread lookup result:', threadId ? `Found: ${threadId}` : 'Not found - will create');

      // If no thread exists, create one
      if (!threadId) {
        console.log('📝 [addComment] Creating new thread for wall item...');
        // Get photo details
        const { data: wallItem } = await supabase
          .from('wall_items')
          .select('circle_id, content, created_by')
          .eq('id', wallItemId)
          .single();

        if (!wallItem) {
          console.error('❌ [addComment] Wall item not found:', wallItemId);
          toast.error('Failed to find photo');
          setComments(prev => prev.filter(c => c.id !== tempId));
          setOptimisticCommentId(null);
          return;
        }

        console.log('📊 [addComment] Wall item found - circle_id:', wallItem.circle_id);

        // Create thread
        const { data: newThread, error: threadError } = await supabase
          .from('chat_threads')
          .insert({
            circle_id: wallItem.circle_id,
            title: `📷 ${(wallItem.content as any)?.caption || 'Photo conversation'}`,
            created_by: currentUserId,
            linked_wall_item_id: wallItemId,
          })
          .select()
          .single();

        if (threadError) {
          console.error('❌ [addComment] Error creating thread:', threadError.message, threadError.details);
          toast.error('Failed to create conversation');
          setComments(prev => prev.filter(c => c.id !== tempId));
          setOptimisticCommentId(null);
          return;
        }

        threadId = newThread?.id;
        console.log('✅ [addComment] Thread created successfully:', threadId);

        // Add photo creator as thread member
        if (threadId && wallItem.created_by !== currentUserId) {
          await supabase
            .from('thread_members')
            .insert({ thread_id: threadId, user_id: wallItem.created_by });
        }

        // Add caption as first message if it exists
        if (threadId && (wallItem.content as any)?.caption) {
          await supabase
            .from('chat_messages')
            .insert({
              thread_id: threadId,
              sender_id: wallItem.created_by,
              body: (wallItem.content as any).caption,
            });
        }
      }

      // Add commenter as thread member if not already
      if (threadId) {
        const { data: existingMember } = await supabase
          .from('thread_members')
          .select('id')
          .eq('thread_id', threadId)
          .eq('user_id', currentUserId)
          .single();

        if (!existingMember) {
          await supabase
            .from('thread_members')
            .insert({ thread_id: threadId, user_id: currentUserId });
        }
      }

      // Insert the comment
      console.log('💾 [addComment] Inserting comment into database...');
      const { error: commentError } = await supabase
        .from('wall_item_comments')
        .insert({
          wall_item_id: wallItemId,
          user_id: currentUserId,
          comment_text: commentText.trim(),
        });

      if (commentError) {
        console.error('❌ [addComment] Error inserting comment:', commentError.message, commentError.details);
        console.error('❌ [addComment] Error code:', commentError.code);
        toast.error('Failed to add comment');
        // Remove optimistic comment on error
        setComments(prev => prev.filter(c => c.id !== tempId));
        setOptimisticCommentId(null);
        return;
      }

      console.log('✅ [addComment] Comment inserted successfully into database');
      console.log('🧹 [addComment] Clearing optimistic ID, realtime subscription will refresh');
      setOptimisticCommentId(null);

      // Create corresponding chat message in the thread
      if (threadId) {
        await supabase
          .from('chat_messages')
          .insert({
            thread_id: threadId,
            sender_id: currentUserId,
            body: commentText.trim(),
          });
      }
      
      console.log('🎉 [addComment] Comment flow complete!');
      toast.success('Comment added!');
    } catch (error: any) {
      console.error('❌ [addComment] Unexpected error:', error);
      console.error('❌ [addComment] Error message:', error?.message);
      console.error('❌ [addComment] Error stack:', error?.stack);
      toast.error('Failed to add comment');
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c.id !== tempId));
      setOptimisticCommentId(null);
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
