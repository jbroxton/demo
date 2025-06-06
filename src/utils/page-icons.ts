import { Map, Package, SquareKanban, Component, Calendar, Inbox, CheckSquare } from 'lucide-react';
import type { PageType } from '@/types/models/Page';

// Centralized icon mapping for page types
export const PAGE_TYPE_ICONS = {
  product: Package,      // Package icon for Product
  project: SquareKanban, // Square Kanban icon for Project  
  feature: Component,    // Component icon for Features
  requirement: CheckSquare, // CheckSquare icon for Requirements
  release: Calendar,     // Calendar icon for Release
  roadmap: Map,          // Map icon for Roadmap
  feedback: Inbox        // Inbox icon for Feedback
} as const;

// Helper function to get icon component for a page type
export function getPageTypeIcon(type: PageType) {
  return PAGE_TYPE_ICONS[type] || Component; // Default to Component icon
}

// Helper function to get icon name for debugging
export function getPageTypeIconName(type: PageType): string {
  const iconMap = {
    product: 'Package',
    project: 'SquareKanban', 
    feature: 'Component',
    requirement: 'CheckSquare',
    release: 'Calendar',
    roadmap: 'Map',
    feedback: 'Inbox'
  };
  return iconMap[type] || 'Component';
}