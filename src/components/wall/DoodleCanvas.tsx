import { useState } from "react";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DoodleCanvasProps {
  content: {
    imageUrl: string;
  };
  onDelete?: () => void;
  isCreator?: boolean;
  fullWidth?: boolean;
}

export const DoodleCanvas = ({ content, onDelete, isCreator, fullWidth }: DoodleCanvasProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <Card className={`p-2 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-200 dark:border-teal-800 ${fullWidth ? 'w-full max-w-full' : 'w-[240px]'} relative`}>
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
      <img
        src={content.imageUrl}
        alt="Doodle"
        className="w-full h-auto rounded"
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this doodle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this doodle from the wall.
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
