"use client";

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { getPageTypeIcon } from '@/utils/page-icons';
import { getAllowedChildTypes, canHaveChildren } from '@/utils/page-parenting-rules';
import { PageType } from '@/types/models/Page';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useTabsQuery } from '@/hooks/use-tabs-query';

interface PageContextMenuProps {
  children: React.ReactNode;
  pageId: string;
  pageType: PageType;
  pageTitle: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PageContextMenu({
  children,
  pageId,
  pageType,
  pageTitle,
  onEdit,
  onDelete,
}: PageContextMenuProps) {
  const { addPage } = usePagesQuery();
  const { openTab } = useTabsQuery();

  const handleCreateChild = async (childType: PageType) => {
    console.log(`🔨 Creating ${childType} child for page:`, { pageId, pageType, pageTitle });
    try {
      const pageData = {
        type: childType,
        title: `New ${childType.charAt(0).toUpperCase() + childType.slice(1)}`,
        parent_id: pageId,
        properties: {},
        blocks: [
          {
            id: `doc-${pageId}-${Date.now()}`,
            type: 'document' as const,
            content: {
              tiptap_content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: `This is a new ${childType}. Start editing to add your content.`
                      }
                    ]
                  }
                ]
              }
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };
      console.log('🔨 Page data to create:', pageData);
      console.log('🔨 PageId being used as parent:', pageId, typeof pageId);
      
      const newPage = await addPage(pageData);
      console.log(`🔨 ✅ Successfully created new ${childType} under ${pageType}:`, newPage);
      console.log(`🔨 ✅ Created page details:`, {
        id: newPage.id,
        type: newPage.type,
        title: newPage.title,
        parent_id: newPage.parent_id,
        blocksCount: newPage.blocks?.length || 0
      });
      
      // Open tab for the new page (following Product section pattern)
      try {
        openTab({
          title: newPage.title,
          type: 'page',
          itemId: newPage.id,
          hasChanges: false
        });
        console.log('Tab opened for new page');
      } catch (tabError) {
        console.error('Error opening tab for new page:', tabError);
      }
    } catch (error) {
      console.error(`Error creating ${childType}:`, error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const allowedChildTypes = getAllowedChildTypes(pageType);
  const hasChildOptions = canHaveChildren(pageType);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {hasChildOptions && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Plus className="h-4 w-4 mr-2" />
                Add Child
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {allowedChildTypes.map((childType) => {
                  const IconComponent = getPageTypeIcon(childType);
                  return (
                    <ContextMenuItem
                      key={childType}
                      onClick={() => handleCreateChild(childType)}
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      New {childType.charAt(0).toUpperCase() + childType.slice(1)}
                    </ContextMenuItem>
                  );
                })}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}
        
        {onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit {pageType.charAt(0).toUpperCase() + pageType.slice(1)}
          </ContextMenuItem>
        )}
        
        <ContextMenuItem onClick={() => navigator.clipboard.writeText(pageTitle)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Title
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {onDelete && (
          <ContextMenuItem 
            onClick={onDelete}
            className="text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {pageType.charAt(0).toUpperCase() + pageType.slice(1)}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}