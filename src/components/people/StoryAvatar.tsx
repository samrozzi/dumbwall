import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import avatarBorder from "@/assets/avatar-border.png";

interface StoryAvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  hasUnviewedStory?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export const StoryAvatar = ({
  src,
  alt,
  size = "md",
  hasUnviewedStory = false,
  onClick,
  className,
}: StoryAvatarProps) => {
  return (
    <div
      className={cn(
        "relative flex-shrink-0 cursor-pointer",
        sizeMap[size],
        className
      )}
      onClick={onClick}
    >
      {/* Gradient ring for unviewed stories */}
      {hasUnviewedStory && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500 p-[2px]">
          <div className="w-full h-full rounded-full bg-background" />
        </div>
      )}
      
      {/* Avatar with border overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Avatar className={cn("w-[85%] h-[85%]")} key={src}>
          <AvatarImage 
            src={src || undefined} 
            alt={alt}
            onLoad={() => console.log("Avatar loaded:", src)}
            onError={(e) => console.error("Avatar failed to load:", src, e)}
          />
          <AvatarFallback className="bg-muted text-xs">
            {alt.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Border frame overlay */}
      <img
        src={avatarBorder}
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
