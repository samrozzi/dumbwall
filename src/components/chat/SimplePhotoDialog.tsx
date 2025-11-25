import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimplePhotoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption?: string;
}

export const SimplePhotoDialog = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
}: SimplePhotoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-background border-2 border-primary [&>button]:hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="overflow-hidden rounded-lg">
          <img
            src={imageUrl}
            alt={caption || "Photo"}
            className="w-full h-auto max-h-[80vh] object-contain bg-black"
          />
          {caption && (
            <div className="p-4 bg-muted border-t-2 border-primary">
              <p className="text-sm font-semibold">{caption}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
