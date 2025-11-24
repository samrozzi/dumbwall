import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface DoodleCanvasProps {
  content: {
    imageUrl: string;
  };
  onDelete?: () => void;
  isCreator?: boolean;
}

export const DoodleCanvas = ({ content, onDelete, isCreator }: DoodleCanvasProps) => {
  return (
    <Card className="p-2 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-200 dark:border-teal-800 w-[320px] relative">
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
      <img
        src={content.imageUrl}
        alt="Doodle"
        className="w-full h-auto rounded"
      />
    </Card>
  );
};
