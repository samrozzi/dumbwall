import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption?: string;
}

export const PhotoViewerDialog = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
}: PhotoViewerDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-background border-2 border-primary">
        <DialogHeader className="absolute right-2 top-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full bg-background/80 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
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
