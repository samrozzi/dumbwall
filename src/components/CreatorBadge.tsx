import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatorBadgeProps {
  avatarUrl?: string | null;
  username?: string | null;
  className?: string;
}

export const CreatorBadge = ({ avatarUrl, username, className = "" }: CreatorBadgeProps) => {
  return (
    <div className={`absolute -top-2 -left-3 z-10 ${className}`}>
      <Avatar className="w-10 h-10 border-2 border-background shadow-md bg-white">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {username?.slice(0, 2).toUpperCase() || "??"}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};
