import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Image, Mic, Smile, Clapperboard } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { GifPicker } from './GifPicker';
import { toast } from 'sonner';

interface AttachmentMenuProps {
  onPhotoSelect: (files: FileList) => void;
  onVoiceStart: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gifUrl: string, gifTitle: string) => void;
  disabled?: boolean;
}

export const AttachmentMenu = ({
  onPhotoSelect,
  onVoiceStart,
  onEmojiSelect,
  onGifSelect,
  disabled = false
}: AttachmentMenuProps) => {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
    setOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onPhotoSelect(e.target.files);
    }
  };

  const handleVoiceClick = () => {
    onVoiceStart();
    setOpen(false);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            variant="outline" 
            disabled={disabled}
            title="Add attachment"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start" side="top">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              className="h-auto flex-col gap-2 p-4"
              onClick={handlePhotoClick}
            >
              <Image className="w-6 h-6" />
              <span className="text-sm">Photo</span>
            </Button>
            
            <Button
              variant="ghost"
              className="h-auto flex-col gap-2 p-4"
              onClick={handleVoiceClick}
            >
              <Mic className="w-6 h-6" />
              <span className="text-sm">Voice</span>
            </Button>

            <div className="col-span-1">
              <EmojiPicker 
                onEmojiSelect={(emoji) => {
                  onEmojiSelect(emoji);
                  setOpen(false);
                }}
                trigger={
                  <Button
                    variant="ghost"
                    className="h-auto flex-col gap-2 p-4 w-full"
                  >
                    <Smile className="w-6 h-6" />
                    <span className="text-sm">Emoji</span>
                  </Button>
                }
              />
            </div>

            <div className="col-span-1">
              <GifPicker 
                onGifSelect={(url, title) => {
                  onGifSelect(url, title);
                  setOpen(false);
                }}
                trigger={
                  <Button
                    variant="ghost"
                    className="h-auto flex-col gap-2 p-4 w-full"
                  >
                    <Clapperboard className="w-6 h-6" />
                    <span className="text-sm">GIF</span>
                  </Button>
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};
