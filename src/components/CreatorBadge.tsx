import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatorBadgeProps {
  avatarUrl?: string | null;
  username?: string | null;
  className?: string;
}

export const CreatorBadge = ({ avatarUrl, username, className = "" }: CreatorBadgeProps) => {
  return (
    <div className={`absolute top-2 left-2 z-10 ${className}`}>
      <Avatar className="w-6 h-6 border-2 border-background shadow-md">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="text-[10px]">
          {username?.slice(0, 2).toUpperCase() || "??"}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};
