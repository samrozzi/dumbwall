import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ExternalLink } from "lucide-react";

interface MusicDropProps {
  content: {
    songTitle: string;
    artist: string;
    albumArt?: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
    appleUrl?: string;
  };
}

export const MusicDrop = ({ content }: MusicDropProps) => {
  const musicUrl = content.spotifyUrl || content.youtubeUrl || content.appleUrl;

  const handlePlay = () => {
    if (musicUrl) {
      window.open(musicUrl, "_blank");
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800 w-[280px]">
      <div className="flex gap-3">
        {content.albumArt ? (
          <img
            src={content.albumArt}
            alt={content.songTitle}
            className="w-16 h-16 rounded object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded bg-indigo-200 dark:bg-indigo-900 flex items-center justify-center">
            <Music className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm truncate text-foreground">{content.songTitle}</h4>
          <p className="text-xs text-muted-foreground truncate">{content.artist}</p>
          {musicUrl && (
            <Button
              onClick={handlePlay}
              size="sm"
              className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Play
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
