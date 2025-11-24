import { useState, useEffect, useRef, useCallback } from "react";
import { useLongPress } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
  children: React.ReactNode[];
  onReorder?: (itemId: string, newOrder: number) => void;
  itemIds: string[];
}

export const MasonryGrid = ({ children, onReorder, itemIds }: MasonryGridProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [columnCount, setColumnCount] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Responsive column count
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(2); // Mobile
      } else if (width < 1024) {
        setColumnCount(3); // Tablet
      } else {
        setColumnCount(2); // Keep masonry even on larger screens
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const handleDragStart = useCallback((index: number, e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDraggedIndex(index);
    setDragPosition({ x: clientX, y: clientY });
  }, []);

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (draggedIndex === null) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragPosition({ x: clientX, y: clientY });
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && onReorder) {
      // Calculate new position based on drop location
      // For now, we'll keep it in the same masonry flow
      onReorder(itemIds[draggedIndex], draggedIndex);
    }
    setDraggedIndex(null);
  }, [draggedIndex, onReorder, itemIds]);

  useEffect(() => {
    if (draggedIndex !== null) {
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('mouseup', handleDragEnd);

      return () => {
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [draggedIndex, handleDragMove, handleDragEnd]);

  // Generate stable random rotation for each item based on its ID
  const getRotation = (index: number) => {
    const seed = itemIds[index]?.charCodeAt(0) || 0;
    const rotation = ((seed % 7) - 3); // Range: -3 to +3 degrees
    return rotation;
  };

  return (
    <div 
      ref={containerRef}
      className="pb-24 px-2"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: '1rem',
        gridAutoRows: '10px', // Fine-grained row control
      }}
    >
      {children.map((child, index) => {
        const longPressHandlers = useLongPress({
          onLongPress: () => handleDragStart(index, event as any),
          ms: 500,
        });

        const rotation = getRotation(index);
        const isDragging = draggedIndex === index;

        return (
          <div
            key={itemIds[index]}
            ref={el => itemRefs.current[index] = el}
            className={cn(
              "transition-all duration-300",
              isDragging && "opacity-50 scale-95"
            )}
            style={{
              gridColumn: 'span 1',
              transform: isDragging 
                ? `translate(${dragPosition.x - (itemRefs.current[index]?.getBoundingClientRect().left || 0)}px, ${dragPosition.y - (itemRefs.current[index]?.getBoundingClientRect().top || 0)}px) rotate(${rotation}deg) scale(1.05)`
                : `rotate(${rotation}deg)`,
              position: isDragging ? 'fixed' : 'relative',
              zIndex: isDragging ? 9999 : 1,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
            {...longPressHandlers}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
