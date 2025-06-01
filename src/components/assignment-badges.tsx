"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AssignmentItem {
  id: string;
  title: string;
}

interface AssignmentBadgesProps {
  /** Array of assigned items to display */
  items: AssignmentItem[];
  /** Callback when an item is removed */
  onRemove: (itemId: string) => void;
  /** Text to show when no items are assigned */
  emptyText: string;
  /** Optional className for styling */
  className?: string;
  /** Disabled state - prevents removal */
  disabled?: boolean;
}

export function AssignmentBadges({
  items,
  onRemove,
  emptyText,
  className,
  disabled = false
}: AssignmentBadgesProps) {
  
  if (items.length === 0) {
    return (
      <div className={cn("text-white/60 text-sm italic", className)}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <Badge
          key={item.id}
          variant="secondary"
          className="bg-white/10 text-white/80 hover:bg-white/15 transition-colors flex items-center gap-1 max-w-[200px]"
        >
          <span className="truncate flex-1">{item.title}</span>
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto w-4 hover:bg-white/20 ml-1"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(item.id);
              }}
              aria-label={`Remove ${item.title}`}
            >
              <X className="h-3 w-3 text-white/60 hover:text-white" />
            </Button>
          )}
        </Badge>
      ))}
    </div>
  );
}