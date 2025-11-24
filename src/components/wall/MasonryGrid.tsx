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
        setColumnCount(2); // Two-column masonry on mobile like Pinterest
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

  // Calculate row spans based on item heights (skip for mobile)
  useLayoutEffect(() => {
    // Skip row span calculation on mobile - let CSS Grid auto-size
    if (columnCount === 2) {
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
    const seed = itemIds[index]?.charCodeAt(0) || 0;
    // Subtle rotation on mobile, full rotation on desktop
    if (columnCount === 2) {
      return ((seed % 5) - 2); // ±2° on mobile/tablet
    }
    return ((seed % 7) - 3); // ±3° on desktop
  };

  // Generate column span based on item type and random variation
  const getColumnSpan = (index: number) => {
    const seed = itemIds[index]?.charCodeAt(0) || 0;
    const random = (seed % 100) / 100;
    
    if (columnCount === 2) {
      return 1; // Always 1 column on mobile/tablet for clean masonry
    } else {
      // Desktop: 50% narrow, 35% medium, 15% wide
      if (random > 0.85) return 3;
      if (random > 0.50) return 2;
      return 1;
    }
  };

  // Generate random micro-offsets for chaos
  const getOffset = (index: number) => {
    const seed = itemIds[index]?.charCodeAt(0) || 0;
    // Smaller offsets on mobile for tighter packing
    if (columnCount === 2) {
      return {
        x: ((seed % 3) - 1), // ±1px on mobile/tablet
        y: ((seed % 3) - 1),
      };
    }
    return {
      x: ((seed % 5) - 2), // ±2px on desktop
      y: ((seed % 7) - 3),
    };
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
      className="pb-24 px-2 max-w-full overflow-x-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap: columnCount === 2 ? '0.5rem' : '1rem',
        gridAutoRows: columnCount === 2 ? 'auto' : '10px', // Natural sizing on mobile
        gridAutoFlow: columnCount === 2 ? 'row' : 'dense', // Predictable stacking on mobile
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
              gridRowEnd: columnCount === 2 ? 'auto' : `span ${rowSpans[index] || 20}`,
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
              // Only enable drag on desktop with faster response
              if (columnCount === 3) {
                const timeout = setTimeout(() => {
                  handleMouseDown(index, e);
                }, 200); // Faster drag activation on desktop
                
                const cleanup = () => clearTimeout(timeout);
                window.addEventListener('mouseup', cleanup, { once: true });
                window.addEventListener('mousemove', cleanup, { once: true });
              }
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
