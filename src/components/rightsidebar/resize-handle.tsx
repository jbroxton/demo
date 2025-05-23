'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIState } from '@/providers/ui-state-provider';

interface ResizeHandleProps {
  className?: string;
}

/**
 * ResizeHandle Component
 * 
 * Provides a draggable handle to resize the right sidebar width.
 * 
 * How it works:
 * 1. User drags the handle (mouse/touch events)
 * 2. Updates rightSidebarWidth in UIState (280px-600px range)
 * 3. Dashboard layout re-renders with new gridTemplateColumns
 * 4. CSS Grid properly constrains utility panel to new width
 * 5. Canvas adjusts to take remaining space (no overlap)
 * 
 * Key fix: Direct gridTemplateColumns update bypasses CSS variable issues
 */
export function ResizeHandle({ className }: ResizeHandleProps) {
  const {
    rightSidebarWidth,
    setRightSidebarWidth, // This triggers CSS Grid column update
    isResizing,
    setIsResizing,
    rightSidebarMinWidth,
    rightSidebarMaxWidth,
  } = useUIState();

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = rightSidebarWidth;
    setIsResizing(true);
    
    // Add cursor style to body during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [rightSidebarWidth, setIsResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    
    e.preventDefault();
    
    // Calculate new width based on mouse movement
    // Note: moving left (negative delta) should increase width since we're on the left edge
    const deltaX = startX.current - e.clientX;
    const newWidth = Math.max(
      rightSidebarMinWidth,
      Math.min(rightSidebarMaxWidth, startWidth.current + deltaX)
    );
    
    setRightSidebarWidth(newWidth);
  }, [rightSidebarMinWidth, rightSidebarMaxWidth, setRightSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    setIsResizing(false);
    
    // Reset cursor styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [setIsResizing]);

  // Touch events for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    const touch = e.touches[0];
    isDragging.current = true;
    startX.current = touch.clientX;
    startWidth.current = rightSidebarWidth;
    setIsResizing(true);
  }, [rightSidebarWidth, setIsResizing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = startX.current - touch.clientX;
    const newWidth = Math.max(
      rightSidebarMinWidth,
      Math.min(rightSidebarMaxWidth, startWidth.current + deltaX)
    );
    
    setRightSidebarWidth(newWidth);
  }, [rightSidebarMinWidth, rightSidebarMaxWidth, setRightSidebarWidth]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    setIsResizing(false);
  }, [setIsResizing]);

  // Set up global event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalTouchMove = (e: TouchEvent) => handleTouchMove(e);
    const handleGlobalTouchEnd = () => handleTouchEnd();

    if (isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      className={cn(
        // Base styles - wider hit area for better UX
        "absolute left-0 top-0 bottom-0 w-2 z-50",
        "flex items-center justify-center",
        "cursor-col-resize select-none",
        // Hover and active states
        "hover:bg-border/30 active:bg-border/50",
        // Transition for smooth interactions
        "transition-all duration-200",
        // Background styling
        "bg-transparent",
        isResizing && "bg-border/50",
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="separator"
      aria-label="Resize sidebar"
      aria-orientation="vertical"
      tabIndex={0}
      onKeyDown={(e) => {
        // Keyboard support for accessibility
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const newWidth = Math.min(rightSidebarMaxWidth, rightSidebarWidth + 10);
          setRightSidebarWidth(newWidth);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const newWidth = Math.max(rightSidebarMinWidth, rightSidebarWidth - 10);
          setRightSidebarWidth(newWidth);
        }
      }}
    >
      {/* Visual indicator using shadcn's lucide icon */}
      <div
        className={cn(
          "flex items-center justify-center",
          "w-1 h-12 rounded-full",
          "bg-muted border border-border",
          "shadow-sm",
          "opacity-0 group-hover:opacity-100",
          "transition-all duration-200",
          "hover:bg-accent hover:scale-110",
          isResizing && "opacity-100 bg-accent scale-110"
        )}
      >
        <GripVertical 
          className={cn(
            "h-4 w-4 text-muted-foreground",
            "group-hover:text-accent-foreground",
            isResizing && "text-accent-foreground"
          )} 
        />
      </div>
    </div>
  );
}