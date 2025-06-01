"use client";

import React from 'react';
import { Plus, Package, Puzzle, Calendar, Map, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { EntityCreator } from '@/components/entity-creator';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import type { PageType } from '@/types/models/Page';

interface PageTypeCreatorProps {
  buttonClassName?: string;
  collapsed?: boolean;
}

export function PageTypeCreator({ buttonClassName = '', collapsed = false }: PageTypeCreatorProps) {
  const { addPage } = usePagesQuery();
  const { openTab } = useTabsQuery();

  // Page type options with their icons (feature is default single-click, but also available in menu)
  const pageTypes: Array<{ type: PageType; label: string; icon: React.ComponentType<any> }> = [
    { type: 'feature', label: 'Feature', icon: Puzzle },
    { type: 'project', label: 'Project', icon: FolderOpen },
    { type: 'roadmap', label: 'Roadmap', icon: Map },
  ];

  const handleCreatePageType = async (pageType: PageType) => {
    console.log(`Creating new ${pageType} page...`);
    try {
      const newPage = await addPage({
        type: pageType,
        title: `New ${pageType.charAt(0).toUpperCase() + pageType.slice(1)}`,
        parent_id: undefined, // Top-level page
        properties: {},
        blocks: []
      });
      
      console.log(`Successfully created new ${pageType} page:`, newPage);
      
      // Open tab for the new page
      await openTab({
        title: newPage.title,
        type: 'page',
        itemId: newPage.id,
        hasChanges: false
      });
      
      console.log('Tab opened for new page');
    } catch (error) {
      console.error(`Error creating ${pageType} page:`, error);
    }
  };

  // Default single click handler - creates feature
  const handleDefaultClick = () => {
    handleCreatePageType('feature');
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${collapsed ? 'mx-auto' : ''} w-4 h-4 p-0 rounded hover:bg-white/10 flex items-center justify-center transition-colors ${buttonClassName}`}
          title="Add Feature (right-click for more options)"
          onClick={handleDefaultClick}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {pageTypes.map(({ type, label, icon: Icon }) => (
          <ContextMenuItem
            key={type}
            onClick={() => handleCreatePageType(type)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Icon className="h-4 w-4" />
            New {label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}