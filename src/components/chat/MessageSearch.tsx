import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  thread_id: string;
  sender_name: string;
  thread_title: string;
}

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circleId: string;
  onMessageClick: (threadId: string, messageId: string) => void;
}

export const MessageSearch = ({ open, onOpenChange, circleId, onMessageClick }: MessageSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchMessages(query);
    }, 300); // Debounce 300ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const searchMessages = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Get all threads in the circle
      const { data: threads } = await supabase
        .from('chat_threads')
        .select('id, title')
        .eq('circle_id', circleId);

      if (!threads || threads.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const threadIds = threads.map(t => t.id);

      // Search messages using ilike for case-insensitive search
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, body, created_at, sender_id, thread_id')
        .in('thread_id', threadIds)
        .ilike('body', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Search error:', error);
        setResults([]);
        setLoading(false);
        return;
      }

      if (!messages || messages.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Fetch sender profiles
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .in('id', senderIds);

      // Map results
      const searchResults: SearchResult[] = messages.map(msg => {
        const thread = threads.find(t => t.id === msg.thread_id);
        const profile = profiles?.find(p => p.id === msg.sender_id);

        return {
          id: msg.id,
          body: msg.body,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          thread_id: msg.thread_id,
          sender_name: profile?.display_name || profile?.username || 'Unknown',
          thread_title: thread?.title || 'Unknown Thread'
        };
      });

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onMessageClick(result.thread_id, result.id);
    onOpenChange(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-primary/30 text-primary-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {loading && (
            <div className="text-center text-sm text-muted-foreground py-4">
              Searching...
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              No messages found
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">Use ↑↓ to navigate</span>
              </div>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent border border-primary'
                      : 'bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-sm">{result.sender_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    in {result.thread_title}
                  </div>
                  <div className="text-sm line-clamp-2">
                    {highlightMatch(result.body, query)}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
