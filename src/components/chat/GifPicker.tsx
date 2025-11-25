import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GifPickerProps {
  onGifSelect: (gifUrl: string, gifTitle: string) => void;
  trigger?: React.ReactNode;
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
    downsized_medium: {
      url: string;
    };
  };
}

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
const GIPHY_ENDPOINT = 'https://api.giphy.com/v1/gifs';

export const GifPicker = ({ onGifSelect, trigger }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch trending GIFs on open
  useEffect(() => {
    if (open && gifs.length === 0) {
      fetchTrending();
    }
  }, [open]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${GIPHY_ENDPOINT}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      toast.error('Failed to load GIFs');
      console.error('Giphy API error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      fetchTrending();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${GIPHY_ENDPOINT}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      toast.error('Failed to search GIFs');
      console.error('Giphy API error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchGifs(query);
  };

  const handleGifClick = (gif: GiphyGif) => {
    onGifSelect(gif.images.downsized_medium.url, gif.title);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button size="icon" variant="outline" title="Add GIF">
            <Smile className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search GIFs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : gifs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No GIFs found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleGifClick(gif)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <img
                      src={gif.images.fixed_height_small.url}
                      alt={gif.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t text-center text-xs text-muted-foreground">
            Powered by GIPHY
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
