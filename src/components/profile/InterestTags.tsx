import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface InterestTagsProps {
  interests: string[];
  isEditable?: boolean;
  onRemove?: (interest: string) => void;
}

export const InterestTags = ({ interests, isEditable, onRemove }: InterestTagsProps) => {
  if (interests.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((interest) => (
        <Badge key={interest} variant="secondary" className="gap-1">
          {interest}
          {isEditable && onRemove && (
            <button
              onClick={() => onRemove(interest)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
};
