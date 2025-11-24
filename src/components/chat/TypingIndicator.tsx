import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingUser {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      const user = typingUsers[0];
      const name = user.display_name || user.username;
      return `${name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].display_name || typingUsers[0].username} and ${typingUsers[1].display_name || typingUsers[1].username} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
      {typingUsers.slice(0, 3).map((user) => (
        <Avatar key={user.user_id} className="w-6 h-6 ring-2 ring-primary/20">
          <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.username} />
          <AvatarFallback className="text-[10px]">
            {(user.display_name || user.username).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      <span className="flex items-center gap-1">
        {getTypingText()}
        <span className="inline-flex gap-0.5">
          <span className="animate-bounce [animation-delay:-0.3s]">.</span>
          <span className="animate-bounce [animation-delay:-0.15s]">.</span>
          <span className="animate-bounce">.</span>
        </span>
      </span>
    </div>
  );
};
