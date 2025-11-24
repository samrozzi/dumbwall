import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PrivacyToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}

export const PrivacyToggle = ({ isPublic, onChange }: PrivacyToggleProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(!isPublic)}
          className={isPublic ? "text-muted-foreground" : "text-primary"}
        >
          {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isPublic ? "Public - visible on your profile" : "Private - hidden from profile"}
      </TooltipContent>
    </Tooltip>
  );
};
