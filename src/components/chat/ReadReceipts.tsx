import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface ReadReceipt {
  user_id: string;
  read_at: string;
  avatar_url: string | null;
  display_name: string | null;
  username: string | null;
}

interface ReadReceiptsProps {
  readBy: ReadReceipt[];
  totalMembers?: number;
}

export const ReadReceipts = ({ readBy, totalMembers }: ReadReceiptsProps) => {
  if (readBy.length === 0) return null;

  const displayAvatars = readBy.slice(0, 3);
  const remainingCount = readBy.length - displayAvatars.length;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5 -space-x-2">
        {displayAvatars.map((receipt) => (
          <Tooltip key={receipt.user_id}>
            <TooltipTrigger asChild>
              <Avatar className="w-4 h-4 border border-background ring-1 ring-primary/30 cursor-pointer hover:z-10">
                <AvatarImage
                  src={receipt.avatar_url || undefined}
                  alt={receipt.display_name || receipt.username || 'User'}
                />
                <AvatarFallback className="text-[8px] bg-primary/10">
                  {(receipt.display_name || receipt.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{receipt.display_name || receipt.username}</p>
              <p className="text-muted-foreground">
                Read {formatDistanceToNow(new Date(receipt.read_at), { addSuffix: true })}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <div className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center">
            <span className="text-[8px] font-medium">+{remainingCount}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
