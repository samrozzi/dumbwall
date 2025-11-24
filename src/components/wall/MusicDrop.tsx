import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ExternalLink, X } from "lucide-react";

interface MusicDropProps {
  content: {
    songTitle: string;
    artist: string;
    albumArt?: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
    appleUrl?: string;
  };
  onDelete?: () => void;
  isCreator?: boolean;
}

export const MusicDrop = ({ content, onDelete, isCreator }: MusicDropProps) => {
  const musicUrl = content.spotifyUrl || content.youtubeUrl || content.appleUrl;

  const handlePlay = () => {
    if (musicUrl) {
      window.open(musicUrl, "_blank");
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800 w-[280px] relative">
      {isCreator && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}
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
          <h4 className="font-bold text-sm truncate text-gray-900 dark:text-white">{content.songTitle}</h4>
          <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{content.artist}</p>
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
