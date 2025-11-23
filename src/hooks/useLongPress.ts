import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  ms?: number;
}

export const useLongPress = ({ onLongPress, onClick, ms = 300 }: UseLongPressOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isLongPressRef.current = false;

    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, ms);
  }, [onLongPress, ms]);

  const clear = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isLongPressRef.current && onClick) {
      onClick();
    }
    
    isLongPressRef.current = false;
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
};
