import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
  children: React.ReactNode[];
  onReorder?: (itemId: string, newOrder: number) => void;
  itemIds: string[];
}

export const MasonryGrid = ({ children, onReorder, itemIds }: MasonryGridProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [columnCount, setColumnCount] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Responsive column count
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(3);
      } else {
        setColumnCount(2);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const handleDragStart = useCallback((index: number, clientX: number, clientY: number) => {
    setDraggedIndex(index);
    dragStartPos.current = { x: clientX, y: clientY };
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (draggedIndex === null) return;
    
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({
      x: clientX - dragStartPos.current.x,
      y: clientY - dragStartPos.current.y,
    });
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && onReorder) {
      onReorder(itemIds[draggedIndex], draggedIndex);
    }
    setDraggedIndex(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedIndex, onReorder, itemIds]);

  useEffect(() => {
    if (draggedIndex !== null) {
      window.addEventListener('touchmove', handleDragMove, { passive: false });
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
    const rotation = ((seed % 7) - 3);
    return rotation;
  };

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(index, touch.clientX, touch.clientY);
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    handleDragStart(index, e.clientX, e.clientY);
  };

  return (
    <div 
      ref={containerRef}
      className="pb-24 px-2"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: '1rem',
        gridAutoRows: '10px',
      }}
    >
      {children.map((child, index) => {
        const rotation = getRotation(index);
        const isDragging = draggedIndex === index;

        return (
          <div
            key={itemIds[index]}
            ref={el => itemRefs.current[index] = el}
            className={cn(
              "transition-all duration-300 touch-none",
              isDragging && "opacity-50 scale-95 z-[9999]"
            )}
            style={{
              gridColumn: 'span 1',
              transform: isDragging 
                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg) scale(1.05)`
                : `rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
            onTouchStart={(e) => {
              const timeout = setTimeout(() => {
                handleTouchStart(index, e);
              }, 500);
              
              const cleanup = () => clearTimeout(timeout);
              e.currentTarget.addEventListener('touchend', cleanup, { once: true });
              e.currentTarget.addEventListener('touchmove', cleanup, { once: true });
            }}
            onMouseDown={(e) => {
              const timeout = setTimeout(() => {
                handleMouseDown(index, e);
              }, 500);
              
              const cleanup = () => clearTimeout(timeout);
              window.addEventListener('mouseup', cleanup, { once: true });
              window.addEventListener('mousemove', cleanup, { once: true });
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
