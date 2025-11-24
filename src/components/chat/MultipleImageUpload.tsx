import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';

interface MultipleImageUploadProps {
  onImagesSelected: (files: File[], captions: string[]) => void;
  maxImages?: number;
}

export const MultipleImageUpload = ({ onImagesSelected, maxImages = 10 }: MultipleImageUploadProps) => {
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string; caption: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (selectedImages.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: { file: File; preview: string; caption: string }[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }

      try {
        const compressed = await compressImage(file);
        const compressedFile = new File([compressed.blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        const preview = URL.createObjectURL(compressed.blob);
        newImages.push({ file: compressedFile, preview, caption: '' });
      } catch (error) {
        toast.error(`Failed to process ${file.name}`);
      }
    }

    setSelectedImages(prev => [...prev, ...newImages]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setSelectedImages(prev =>
      prev.map((img, i) => (i === index ? { ...img, caption } : img))
    );
  };

  const handleSend = () => {
    if (selectedImages.length === 0) return;

    const files = selectedImages.map(img => img.file);
    const captions = selectedImages.map(img => img.caption);
    onImagesSelected(files, captions);

    // Cleanup
    selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedImages.length >= maxImages}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Add Images ({selectedImages.length}/{maxImages})
        </Button>

        {selectedImages.length > 0 && (
          <Button size="sm" onClick={handleSend}>
            Send {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {selectedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {selectedImages.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img.preview}
                alt={`Preview ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
              <Input
                placeholder="Add a caption..."
                value={img.caption}
                onChange={(e) => updateCaption(index, e.target.value)}
                className="mt-2"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
