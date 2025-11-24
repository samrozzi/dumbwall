import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ExternalLink, X, Play } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  fullWidth?: boolean;
}

export const MusicDrop = ({ content, onDelete, isCreator, fullWidth }: MusicDropProps) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
    <Card className={`p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-200 dark:border-indigo-800 ${fullWidth ? 'w-full' : 'w-[380px]'} max-w-full relative`}>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-black hover:bg-white/90 dark:hover:bg-black/90 flex items-center justify-center transition-colors z-10 shadow-md"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                height="152"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded"
                title={`${content.songTitle} player`}
              />
              <Button
                onClick={() => setShowEmbed(false)}
                size="sm"
                className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Hide Player
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowEmbed(true)}
                size="icon"
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
                title="Show Player"
              >
                <Play className="w-4 h-4" />
              </Button>
              {musicUrl && (
                <Button
                  onClick={() => window.open(musicUrl, "_blank")}
                  size="icon"
                  variant="outline"
                  className="flex-1 border-indigo-300 dark:border-indigo-700"
                  title={`Open in ${content.spotifyUrl ? "Spotify" : content.youtubeUrl ? "YouTube" : "Music App"}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {musicUrl && showEmbed && (
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this music?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this music from the wall.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onDelete?.();
              setShowDeleteConfirm(false);
            }}>
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
