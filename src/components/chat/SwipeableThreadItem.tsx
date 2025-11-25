import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableThreadItemProps {
  children: React.ReactNode;
  onSwipeDelete?: () => void;
  disabled?: boolean;
}

export const SwipeableThreadItem: React.FC<SwipeableThreadItemProps> = ({
  children,
  onSwipeDelete,
  disabled = false
}) => {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const swipeThreshold = 80; // pixels to trigger delete
  const maxSwipe = 100; // max swipe distance

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Only allow left swipe
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical scroll, don't intercept
      return;
    }

    // Prevent default to stop scrolling while swiping
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
    }

    if (deltaX < 0) {
      // Swiping left - show delete
      const clampedOffset = Math.max(-maxSwipe, deltaX);
      setOffset(clampedOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping || disabled) return;
    setIsSwiping(false);

    if (offset < -swipeThreshold) {
      // Trigger delete
      onSwipeDelete?.();
    }
    
    // Reset offset
    setOffset(0);
  };

  const deleteIconOpacity = Math.min(Math.abs(offset) / swipeThreshold, 1);
  const deleteIconScale = 0.5 + (deleteIconOpacity * 0.5);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete background */}
      <div className="absolute inset-0 bg-destructive flex items-center justify-end pr-6">
        <Trash2 
          className="h-5 w-5 text-destructive-foreground" 
          style={{
            opacity: deleteIconOpacity,
            transform: `scale(${deleteIconScale})`
          }}
        />
      </div>

      {/* Swipeable content */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};
