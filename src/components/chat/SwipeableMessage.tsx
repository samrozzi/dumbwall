import { ReactNode, useRef, useState, TouchEvent } from 'react';
import { CornerDownRight } from 'lucide-react';

interface SwipeableMessageProps {
  children: ReactNode;
  onSwipeReply: () => void;
  disabled?: boolean;
}

export const SwipeableMessage = ({ children, onSwipeReply, disabled = false }: SwipeableMessageProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeThreshold = 60; // pixels to trigger reply
  const maxSwipe = 80;

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Only allow right swipe and prevent if scrolling vertically
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (deltaX > 0) {
      const offset = Math.min(deltaX, maxSwipe);
      setSwipeOffset(offset);

      // Prevent page scrolling during horizontal swipe
      if (offset > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;

    setIsSwiping(false);

    if (swipeOffset >= swipeThreshold) {
      onSwipeReply();
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }

    // Animate back to position
    setSwipeOffset(0);
  };

  const replyIconOpacity = Math.min(swipeOffset / swipeThreshold, 1);
  const replyIconScale = Math.min(0.5 + (swipeOffset / swipeThreshold) * 0.5, 1);

  return (
    <div
      className="relative overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Reply Icon Background */}
      <div
        className="absolute left-0 top-0 h-full flex items-center pl-4 pointer-events-none"
        style={{
          opacity: replyIconOpacity,
          transform: `scale(${replyIconScale})`
        }}
      >
        <div className="bg-primary/20 p-2 rounded-full">
          <CornerDownRight className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Message Content */}
      <div
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
};
