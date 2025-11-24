import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, X } from "lucide-react";

interface AudioClipProps {
  content: {
    audioUrl: string;
    duration: number;
    caption?: string;
  };
  onDelete?: () => void;
  isCreator?: boolean;
}

export const AudioClip = ({ content, onDelete, isCreator }: AudioClipProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progress = content.duration > 0 ? (currentTime / content.duration) * 100 : 0;

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-200 dark:border-orange-800 w-[280px] relative">
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
      <audio
        ref={audioRef}
        src={content.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="flex items-center gap-3">
        <Button
          onClick={togglePlay}
          size="icon"
          className="rounded-full w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
        <div className="flex-1">
          <div className="h-2 bg-orange-200 dark:bg-orange-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mt-1">
            <span>{Math.floor(currentTime)}s</span>
            <span>{content.duration}s</span>
          </div>
        </div>
      </div>
      {content.caption && (
        <p className="text-sm text-foreground mt-3">{content.caption}</p>
      )}
    </Card>
  );
};
