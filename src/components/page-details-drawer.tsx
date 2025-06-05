"use client";

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, Calendar, User, Folder, FileText, Hash } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getPageTypeIcon } from '@/utils/page-icons';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useUnifiedPages } from '@/providers/unified-state-provider';
import { PageAssignmentsSection } from './page-assignments-section';
import type { Page, PageType } from '@/types/models/Page';

interface PageDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageData?: Page;
}

export function PageDetailsDrawer({ 
  isOpen, 
  onClose, 
  pageId, 
  pageData 
}: PageDetailsDrawerProps) {
  const { openTab } = useTabsQuery();
  const pagesState = useUnifiedPages();
  
  // Get page data from provider if not passed as prop
  const page = pageData || (pageId ? pagesState.getPageById(pageId) : null);
  const parentPage = page?.parent_id ? pagesState.getPageById(page.parent_id) : null;
  
  if (!page) {
    return null;
  }

  const PageIcon = getPageTypeIcon(page.type);

  const handleParentClick = () => {
    if (parentPage) {
      openTab({
        title: parentPage.title,
        type: 'page',
        itemId: parentPage.id,
        hasChanges: false
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-[400px] bg-[#0A0A0A] border-white/10 text-white p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PageIcon className="w-5 h-5 text-white/70" />
              <div>
                <SheetTitle className="text-lg font-semibold text-white text-left">
                  Details
                </SheetTitle>
                <Badge 
                  variant="secondary" 
                  className="capitalize bg-white/10 text-white/80 mt-1"
                >
                  {page.type}
                </Badge>
              </div>
            </div>
            <SheetClose asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            
            {/* Page Information */}
            <section>
              <h3 className="text-sm font-medium text-white/90 mb-3">Page Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-white/60 text-sm">Title:</span>
                  <span className="text-white/90 text-sm text-right flex-1 ml-2">
                    {page.title || 'Untitled Page'}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-white/60 text-sm">Type:</span>
                  <div className="flex items-center gap-2">
                    <PageIcon className="w-4 h-4 text-white/70" />
                    <span className="text-white/90 text-sm capitalize">{page.type}</span>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-white/60 text-sm">ID:</span>
                  <span className="text-white/90 text-sm font-mono text-right flex-1 ml-2 break-all">
                    {page.id}
                  </span>
                </div>
              </div>
            </section>

            <Separator className="bg-white/10" />

            {/* Timestamps */}
            <section>
              <h3 className="text-sm font-medium text-white/90 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Created:</span>
                  </div>
                  <span className="text-white/90 text-sm">
                    {formatDate(page.created_at)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Modified:</span>
                  </div>
                  <span className="text-white/90 text-sm">
                    {formatDate(page.updated_at)}
                  </span>
                </div>
              </div>
            </section>

            <Separator className="bg-white/10" />

            {/* Parent Information */}
            {parentPage && (
              <>
                <section>
                  <h3 className="text-sm font-medium text-white/90 mb-3">Hierarchy</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Folder className="w-4 h-4" />
                        <span>Parent:</span>
                      </div>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-blue-400 hover:text-blue-300 text-sm"
                        onClick={handleParentClick}
                      >
                        {parentPage.title}
                      </Button>
                    </div>
                  </div>
                </section>
                <Separator className="bg-white/10" />
              </>
            )}

            {/* Content Statistics */}
            <section>
              <h3 className="text-sm font-medium text-white/90 mb-3">Content</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Hash className="w-4 h-4" />
                    <span>Blocks:</span>
                  </div>
                  <span className="text-white/90 text-sm">
                    {page.block_count || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Last Block Update:</span>
                  </div>
                  <span className="text-white/90 text-sm">
                    {page.last_block_update ? formatDate(page.last_block_update) : 'Never'}
                  </span>
                </div>
              </div>
            </section>

            <Separator className="bg-white/10" />

            {/* Assignments */}
            <PageAssignmentsSection 
              pageId={pageId}
              pageData={page}
            />

            {/* Properties - Hide for feedback pages */}
            {page.type !== 'feedback' && page.properties && Object.keys(page.properties).filter(key => key !== 'assignedTo').length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <section>
                  <h3 className="text-sm font-medium text-white/90 mb-3">Properties</h3>
                  <div className="space-y-3">
                    {Object.entries(page.properties)
                      .filter(([key]) => key !== 'assignedTo') // Exclude assignedTo as it's shown in assignments section
                      .map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-white/60 text-sm capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-white/90 text-sm text-right flex-1 ml-2">
                          {typeof value === 'object' ? 
                            JSON.stringify(value, null, 2) : 
                            String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}