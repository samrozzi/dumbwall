import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
  children: React.ReactNode[];
  onReorder?: (itemId: string, newOrder: number) => void;
  itemIds: string[];
  itemTypes: string[];
}

export const MasonryGrid = ({ children, onReorder, itemIds, itemTypes }: MasonryGridProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [columnCount, setColumnCount] = useState(2);
  const [rowSpans, setRowSpans] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Responsive column count
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumnCount(1); // Single column on mobile for clean stacking
      } else if (width < 1024) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
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

  // Calculate row spans based on item heights (only for masonry layout)
  useLayoutEffect(() => {
    // Skip calculation for mobile single-column layout
    if (columnCount === 1) {
      setRowSpans([]);
      return;
    }

    const calculateRowSpans = () => {
      const newRowSpans = itemRefs.current.map((ref) => {
        if (!ref) return 20; // Reduced minimum fallback
        const height = ref.offsetHeight;
        // Each grid row is 10px, add extra padding to prevent overlap
        const baseSpan = Math.ceil(height / 10);
        const gapPadding = 2; // Reduced from 3 for tighter packing
        return Math.max(20, baseSpan + gapPadding); // Reduced from 30
      });
      setRowSpans(newRowSpans);
    };

    // Initial calculation with delay to ensure DOM is ready
    const timer = setTimeout(calculateRowSpans, 50);

    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateRowSpans, 50);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [children.length, columnCount]);

  // Generate stable random rotation for each item based on its ID
  const getRotation = (index: number) => {
    // No rotation on mobile for clean stacking
    if (columnCount === 1) return 0;
    const seed = itemIds[index]?.charCodeAt(0) || 0;
    const rotation = ((seed % 7) - 3);
    return rotation;
  };

  // Generate column span based on item type and random variation
  const getColumnSpan = (index: number) => {
    // Always span 1 column on mobile for clean stacking
    if (columnCount === 1) return 1;
    
    const seed = itemIds[index]?.charCodeAt(0) || 0;
    const random = (seed % 100) / 100;
    
    if (columnCount === 2) {
      // Tablet: 60% narrow (1 col), 40% wide (2 col)
      return random > 0.6 ? 2 : 1;
    } else {
      // Desktop: 50% narrow, 35% medium, 15% wide
      if (random > 0.85) return 3;
      if (random > 0.50) return 2;
      return 1;
    }
  };

  // Generate random micro-offsets for chaos
  const getOffset = (index: number) => {
    // No offset on mobile for clean stacking
    if (columnCount === 1) return { x: 0, y: 0 };
    const seed = itemIds[index]?.charCodeAt(0) || 0;
    return {
      x: ((seed % 5) - 2), // -2px to +2px
      y: ((seed % 7) - 3), // -3px to +3px
    };
  };

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(index, touch.clientX, touch.clientY);
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    handleDragStart(index, e.clientX, e.clientY);
  };

  // Mobile: Simple vertical flexbox layout
  if (columnCount === 1) {
    return (
      <div className="flex flex-col gap-3 pb-24 px-2 max-w-full">
        {children.map((child, index) => (
          <div key={itemIds[index]} className="w-full">
            {child}
          </div>
        ))}
      </div>
    );
  }

  // Desktop/Tablet: Masonry grid layout
  return (
    <div 
      ref={containerRef}
      className="pb-24 px-2 max-w-full overflow-x-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: '1rem',
        gridAutoRows: '10px',
        gridAutoFlow: 'dense',
      }}
    >
      {children.map((child, index) => {
        const rotation = getRotation(index);
        const offset = getOffset(index);
        const columnSpan = getColumnSpan(index);
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
              gridColumn: `span ${columnSpan}`,
              gridRowEnd: `span ${rowSpans[index] || 20}`,
              transform: isDragging 
                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg) scale(1.05)`
                : `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
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
