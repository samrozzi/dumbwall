import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReplyPreviewProps {
  username: string;
  message: string;
  onCancel: () => void;
}

export function ReplyPreview({ username, message, onCancel }: ReplyPreviewProps) {
  return (
    <div className="flex items-start gap-2 bg-muted/50 border-l-2 border-primary px-3 py-2 mb-2">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-primary mb-0.5">
          Replying to @{username}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {message}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onCancel}
        type="button"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
