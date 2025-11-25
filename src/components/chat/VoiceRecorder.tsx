import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onVoiceRecorded: (audioFile: File, duration: number) => void;
  onCancel: () => void;
  threadId: string;
  userId: string;
}

export const VoiceRecorder = ({ onVoiceRecorded, onCancel, threadId, userId }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      startTimeRef.current = Date.now();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      toast.error('Microphone access denied');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    onCancel();
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
      type: 'audio/webm;codecs=opus'
    });
    
    await onVoiceRecorded(file, recordingTime);

    // Reset state
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob && audioUrl) {
    // Preview mode
    return (
      <div className="flex items-center gap-2 w-full p-2 bg-muted/50 rounded-lg">
        <audio src={audioUrl} controls className="flex-1 h-8" />
        <div className="text-xs text-muted-foreground">{formatTime(recordingTime)}</div>
        <Button size="icon" variant="ghost" onClick={cancelRecording} title="Cancel">
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button size="icon" onClick={sendVoiceMessage} title="Send">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (isRecording) {
    // Recording mode
    return (
      <div className="flex items-center gap-2 w-full p-2 bg-destructive/10 rounded-lg animate-pulse">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          <div className="flex gap-0.5">
            <div className="w-1 h-4 bg-destructive rounded-full animate-[bounce_1s_ease-in-out_infinite]" />
            <div className="w-1 h-6 bg-destructive rounded-full animate-[bounce_1s_ease-in-out_0.1s_infinite]" />
            <div className="w-1 h-5 bg-destructive rounded-full animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
            <div className="w-1 h-7 bg-destructive rounded-full animate-[bounce_1s_ease-in-out_0.3s_infinite]" />
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={cancelRecording} title="Cancel">
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="destructive" onClick={stopRecording} title="Stop">
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    );
  }

  // Initial state - show mic button
  return (
    <Button
      size="icon"
      variant="outline"
      onMouseDown={startRecording}
      onTouchStart={startRecording}
      title="Hold to record voice message"
    >
      <Mic className="w-4 h-4" />
    </Button>
  );
};
