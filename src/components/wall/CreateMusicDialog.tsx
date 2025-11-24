import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateMusicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (songTitle: string, artist: string, musicUrl: string, albumArt?: string) => void;
}

export const CreateMusicDialog = ({ open, onOpenChange, onCreate }: CreateMusicDialogProps) => {
  const [musicUrl, setMusicUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<{
    songTitle: string;
    artist: string;
    albumArt: string;
  } | null>(null);
  const { toast } = useToast();

  const parseUrl = async (url: string) => {
    if (!url) return;
    
    setLoading(true);
    try {
      // Spotify
      if (url.includes('spotify.com/track/')) {
        const trackId = url.match(/track\/([a-zA-Z0-9]+)/)?.[1];
        if (trackId) {
          const oEmbedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`;
          const response = await fetch(oEmbedUrl);
          const data = await response.json();
          
          const parts = data.title?.split(' - ') || [];
          setParsedData({
            songTitle: parts[0] || 'Unknown Song',
            artist: parts[1] || 'Unknown Artist',
            albumArt: data.thumbnail_url || '',
          });
        }
      }
      // YouTube
      else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
        if (videoId) {
          const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
          const response = await fetch(oEmbedUrl);
          const data = await response.json();
          
          setParsedData({
            songTitle: data.title || 'Unknown Song',
            artist: data.author_name || 'Unknown Artist',
            albumArt: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          });
        }
      }
      // Apple Music (simple fallback)
      else if (url.includes('music.apple.com')) {
        toast({
          title: "Apple Music",
          description: "Please enter song details manually",
          variant: "default",
        });
      }
      else {
        toast({
          title: "Unsupported Link",
          description: "Please paste a Spotify or YouTube link",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not parse URL. Try a different link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!parsedData) return;
    
    onCreate(parsedData.songTitle, parsedData.artist, musicUrl, parsedData.albumArt);
    
    setMusicUrl("");
    setParsedData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Music</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Paste Music Link</Label>
            <Input
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              onBlur={() => parseUrl(musicUrl)}
              placeholder="Spotify, YouTube, or Apple Music link..."
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 p-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading song info...</span>
            </div>
          )}

          {parsedData && (
            <div className="flex gap-3 p-3 border-2 border-primary rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
              {parsedData.albumArt && (
                <img src={parsedData.albumArt} className="w-16 h-16 rounded object-cover" alt="Album art" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{parsedData.songTitle}</p>
                <p className="text-sm text-muted-foreground truncate">{parsedData.artist}</p>
              </div>
            </div>
          )}

          <Button onClick={handleCreate} className="w-full" disabled={!parsedData || loading}>
            Post Music
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
