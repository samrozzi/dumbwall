import { useState } from "react";
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
  const [showEmbed, setShowEmbed] = useState(false);
  const musicUrl = content.spotifyUrl || content.youtubeUrl || content.appleUrl;

  const getSpotifyEmbedUrl = (url: string): string | null => {
    const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
    return null;
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) {
      return `https://www.youtube.com/embed/${match[7]}`;
    }
    return null;
  };

  const embedUrl = content.spotifyUrl 
    ? getSpotifyEmbedUrl(content.spotifyUrl)
    : content.youtubeUrl
    ? getYouTubeEmbedUrl(content.youtubeUrl)
    : null;

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
        </div>
      </div>
      
      {embedUrl && (
        <div className="mt-3">
          {showEmbed ? (
            <>
              <iframe
                src={embedUrl}
                width="100%"
                height="232"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded"
                title={`${content.songTitle} player`}
              />
              <Button
                onClick={() => setShowEmbed(false)}
                variant="ghost"
                size="sm"
                className="w-full mt-2"
              >
                Hide Player
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowEmbed(true)}
              size="sm"
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Show Player
            </Button>
          )}
        </div>
      )}

      {musicUrl && (
        <Button
          onClick={() => window.open(musicUrl, "_blank")}
          size="sm"
          variant="outline"
          className="w-full mt-2 border-indigo-300 dark:border-indigo-700"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Open in {content.spotifyUrl ? "Spotify" : content.youtubeUrl ? "YouTube" : "Music App"}
        </Button>
      )}
    </Card>
  );
};
