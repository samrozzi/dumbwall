import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReadReceipt {
  user_id: string;
  read_at: string;
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

export const useReadReceipts = (messageId: string | null) => {
  const [readBy, setReadBy] = useState<ReadReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!messageId) {
      setReadBy([]);
      return;
    }

    const fetchReadReceipts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_read_receipts')
        .select('user_id, read_at')
        .eq('message_id', messageId);

      if (error || !data || data.length === 0) {
        setReadBy([]);
        setLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = data.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url, display_name, username')
        .in('id', userIds);

      if (profiles) {
        const receipts = data.map(receipt => {
          const profile = profiles.find(p => p.id === receipt.user_id);
          return {
            user_id: receipt.user_id,
            read_at: receipt.read_at,
            avatar_url: profile?.avatar_url || null,
            display_name: profile?.display_name || null,
            username: profile?.username || null
          };
        });
        setReadBy(receipts);
      }
      setLoading(false);
    };

    fetchReadReceipts();

    // Subscribe to read receipt changes
    const channel = supabase
      .channel(`read-receipts:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_read_receipts',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          fetchReadReceipts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const markAsRead = async (messageId: string, userId: string) => {
    await supabase
      .from('message_read_receipts')
      .upsert(
        {
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString()
        },
        {
          onConflict: 'message_id,user_id'
        }
      );
  };

  return {
    readBy,
    loading,
    markAsRead
  };
};
