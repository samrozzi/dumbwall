import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Member {
  avatar_url: string | null;
  username: string | null;
  display_name: string | null;
}

interface ThreadAvatarStackProps {
  members: Member[];
  currentUserId: string;
  maxDisplay?: number;
}

export const ThreadAvatarStack = ({ 
  members, 
  currentUserId, 
  maxDisplay = 3 
}: ThreadAvatarStackProps) => {
  // Filter out current user and limit display
  const otherMembers = members.filter(m => m !== null);
  const displayMembers = otherMembers.slice(0, maxDisplay);
  
  if (displayMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex -space-x-2 flex-shrink-0">
      {displayMembers.map((member, i) => (
        <Avatar 
          key={i} 
          className="w-8 h-8 border-2 border-background"
        >
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {member.username?.slice(0, 2).toUpperCase() || 
             member.display_name?.slice(0, 2).toUpperCase() || 
             "??"}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
};
