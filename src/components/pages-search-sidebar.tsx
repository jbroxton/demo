"use client";

import { useState, useMemo } from 'react';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPageTypeIcon } from '@/utils/page-icons';
import type { Page } from '@/types/models/Page';

// Helper to get page type badge color
function getPageTypeBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case 'feature': return 'default';
    case 'roadmap': return 'secondary';
    case 'release': return 'default';
    case 'requirement': return 'outline';
    case 'feedback': return 'destructive';
    default: return 'secondary';
  }
}

export function PagesSearchSidebar() {
  const { pages, isLoading } = usePagesQuery(); // Get all pages, not filtered by type
  const { openTab } = useTabsQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    if (!pages) return [];
    
    return pages
      .filter(page => {
        // Text search - search in title and type
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const titleMatch = page.title.toLowerCase().includes(searchLower);
          const typeMatch = page.type.toLowerCase().includes(searchLower);
          if (!titleMatch && !typeMatch) {
            return false;
          }
        }
        
        // Type filter
        if (typeFilter !== 'all' && page.type !== typeFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by created date, newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [pages, searchTerm, typeFilter]);

  // Group pages by hierarchy (parent-child relationships)
  const groupedPages = useMemo(() => {
    const parentPages = filteredPages.filter(page => !page.parent_id);
    const childPages = filteredPages.filter(page => page.parent_id);
    
    // Create a map of parent ID to children
    const childrenMap = new Map<string, Page[]>();
    childPages.forEach(child => {
      if (!childrenMap.has(child.parent_id!)) {
        childrenMap.set(child.parent_id!, []);
      }
      childrenMap.get(child.parent_id!)!.push(child);
    });
    
    // Build flat list with parent-child ordering
    const result: Array<{ page: Page; isChild: boolean }> = [];
    
    parentPages.forEach(parent => {
      // Add parent
      result.push({ page: parent, isChild: false });
      
      // Add its children if any
      const children = childrenMap.get(parent.id) || [];
      children.forEach(child => {
        result.push({ page: child, isChild: true });
      });
    });
    
    // Add orphaned children (children whose parents aren't in filtered results)
    const addedChildIds = new Set(result.filter(item => item.isChild).map(item => item.page.id));
    childPages.forEach(child => {
      if (!addedChildIds.has(child.id)) {
        result.push({ page: child, isChild: true });
      }
    });
    
    return result;
  }, [filteredPages]);

  const handlePageClick = (page: Page) => {
    openTab({
      title: page.title,
      type: 'page',
      itemId: page.id,
      hasChanges: false
    });
  };

  // Get unique page types for filter
  const pageTypes = useMemo(() => {
    if (!pages) return [];
    const types = [...new Set(pages.map(page => page.type))];
    return types.sort();
  }, [pages]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A] border-r border-white/10 w-80">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border-r border-white/10 w-80" data-testid="pages-list-container">
      {/* Header */}
      <div className="p-4 border-b border-white/10 relative">
        <div className="flex items-center mb-3">
          <Search className="w-5 h-5 text-white/60 mr-2" />
          <h2 className="text-lg font-semibold text-white">Search Pages</h2>
        </div>
        
        {/* Search */}
        <Input
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
          data-testid="pages-search-input"
        />
        
        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full" data-testid="pages-type-filter">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {pageTypes.map(type => (
              <SelectItem key={type} value={type} className="capitalize">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Pages List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {groupedPages.length === 0 ? (
            <div className="text-center text-white/60 py-8 px-4" data-testid="pages-search-empty-state">
              {searchTerm || typeFilter !== 'all' 
                ? 'No pages match your search criteria.'
                : 'No pages found.'}
            </div>
          ) : (
            groupedPages.map(({ page, isChild }) => {
              const Icon = getPageTypeIcon(page.type);

              return (
                <div
                  key={page.id}
                  className={`p-3 rounded-md hover:bg-white/5 cursor-pointer mb-2 ${
                    isChild ? 'ml-4 border-l-2 border-white/10' : ''
                  }`}
                  onClick={() => handlePageClick(page)}
                  data-testid={`pages-search-item-${page.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isChild && <ChevronRight className="w-3 h-3 text-white/40 shrink-0" />}
                        <Icon className="w-4 h-4 text-white/60 shrink-0" />
                        <h3 className="font-medium text-white truncate" data-testid={`pages-search-item-title-${page.id}`}>
                          {page.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={getPageTypeBadgeVariant(page.type)} 
                          className="text-xs"
                          data-testid={`pages-search-item-type-${page.id}`}
                        >
                          {page.type}
                        </Badge>
                        {isChild && (
                          <span className="text-xs text-white/60">
                            Child page
                          </span>
                        )}
                        <span className="text-xs text-white/40">•</span>
                        <span className="text-xs text-white/60">
                          {new Date(page.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      {/* Footer with stats */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>
            {groupedPages.length} page{groupedPages.length !== 1 ? 's' : ''} found
          </span>
          {(searchTerm || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}