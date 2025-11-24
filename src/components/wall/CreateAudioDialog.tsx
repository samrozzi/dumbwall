import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (audioBlob: Blob, duration: number, caption: string) => void;
}

export const CreateAudioDialog = ({ open, onOpenChange, onCreate }: CreateAudioDialogProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= 10) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (!audioBlob || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleCreate = () => {
    if (audioBlob && duration > 0) {
      onCreate(audioBlob, duration, caption);
      setAudioBlob(null);
      setDuration(0);
      setCaption("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Audio Clip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-6">
            {!audioBlob ? (
              <>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  className={`rounded-full w-20 h-20 ${
                    isRecording ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </Button>
                <div className="text-center">
                  <p className="text-2xl font-bold">{duration}s / 10s</p>
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? "Recording..." : "Tap to start"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={togglePlayback}
                  size="lg"
                  className="rounded-full w-20 h-20 bg-orange-500 hover:bg-orange-600"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </Button>
                <audio
                  ref={audioRef}
                  src={URL.createObjectURL(audioBlob)}
                  onEnded={() => setIsPlaying(false)}
                />
                <p className="text-sm text-muted-foreground">
                  {duration}s recording ready
                </p>
                <Button variant="outline" size="sm" onClick={() => setAudioBlob(null)}>
                  Re-record
                </Button>
              </>
            )}
          </div>

          {audioBlob && (
            <>
              <div>
                <Label>Caption (optional)</Label>
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  maxLength={100}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Post Audio
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
