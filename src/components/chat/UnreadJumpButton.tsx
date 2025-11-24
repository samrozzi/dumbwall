import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

interface UnreadJumpButtonProps {
  unreadCount: number;
  onClick: () => void;
  visible: boolean;
}

export const UnreadJumpButton = ({ unreadCount, onClick, visible }: UnreadJumpButtonProps) => {
  if (!visible || unreadCount === 0) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Button
        onClick={onClick}
        className="shadow-lg hover:shadow-xl transition-shadow"
        size="sm"
      >
        <ArrowDown className="w-4 h-4 mr-2 animate-bounce" />
        {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
      </Button>
    </div>
  );
};
