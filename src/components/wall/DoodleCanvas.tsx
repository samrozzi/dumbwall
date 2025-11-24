import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface DoodleCanvasProps {
  content: {
    imageUrl: string;
  };
  onDelete?: () => void;
  isCreator?: boolean;
  fullWidth?: boolean;
}

export const DoodleCanvas = ({ content, onDelete, isCreator, fullWidth }: DoodleCanvasProps) => {
  return (
    <Card className={`p-2 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-2 border-teal-200 dark:border-teal-800 ${fullWidth ? 'w-full max-w-full' : 'w-[320px]'} relative`}>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
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
    </Card>
  );
};
