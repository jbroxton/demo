"use client";

import React, { useState } from 'react';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { PageType } from '@/types/models/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Folder, Target, Package } from 'lucide-react';
import { BlockRenderer } from '@/components/blocks/block-renderer';

interface PagesListProps {
  onPageSelect?: (pageId: string) => void;
  onPageCreate?: (type: PageType) => void;
  selectedPageId?: string;
}

export function PagesList({ onPageSelect, onPageCreate, selectedPageId }: PagesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<PageType | 'all'>('all');
  const [showBlocks, setShowBlocks] = useState(false);

  const { pages, isLoading, error, addPage } = usePagesQuery({
    type: filterType === 'all' ? undefined : filterType,
  });

  // Filter pages by search term
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group pages by type
  const pagesByType = filteredPages.reduce((acc, page) => {
    if (!acc[page.type]) {
      acc[page.type] = [];
    }
    acc[page.type].push(page);
    return acc;
  }, {} as Record<PageType, typeof pages>);

  const handleCreatePage = async (type: PageType) => {
    if (onPageCreate) {
      onPageCreate(type);
    } else {
      // Default creation behavior
      try {
        const newPage = await addPage({
          type,
          title: `New ${type}`,
          properties: {},
          blocks: [],
        });
        if (onPageSelect) {
          onPageSelect(newPage.id);
        }
      } catch (error) {
        console.error('Error creating page:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Loading pages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive">Failed to load pages</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pages</h2>
          <CreatePageDropdown onCreate={handleCreatePage} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pages..."
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <Select value={filterType} onValueChange={(value) => setFilterType(value as PageType | 'all')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="feature">Features</SelectItem>
            <SelectItem value="release">Releases</SelectItem>
            <SelectItem value="roadmap">Roadmaps</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={!showBlocks ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBlocks(false)}
          >
            List View
          </Button>
          <Button
            variant={showBlocks ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBlocks(true)}
          >
            Block View
          </Button>
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {Object.entries(pagesByType).map(([type, typePages]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              {getTypeIcon(type as PageType)}
              <h3 className="font-medium capitalize">{type}s</h3>
              <Badge variant="secondary">{typePages.length}</Badge>
            </div>
            
            <div className="space-y-2">
              {typePages.map(page => (
                <PageCard
                  key={page.id}
                  page={page}
                  isSelected={page.id === selectedPageId}
                  showBlocks={showBlocks}
                  onSelect={() => onPageSelect?.(page.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredPages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No pages match your search.' : 'No pages yet.'}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual page card component
interface PageCardProps {
  page: any;
  isSelected: boolean;
  showBlocks: boolean;
  onSelect: () => void;
}

function PageCard({ page, isSelected, showBlocks, onSelect }: PageCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{page.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {page.type}
            </Badge>
            {page.blocks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {page.blocks.length} blocks
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {showBlocks && page.blocks.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {page.blocks.slice(0, 3).map((block: any) => (
              <div key={block.id} className="text-xs">
                <BlockRenderer block={block} />
              </div>
            ))}
            {page.blocks.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{page.blocks.length - 3} more blocks
              </div>
            )}
          </div>
        </CardContent>
      )}

      {!showBlocks && (
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(page.updated_at).toLocaleDateString()}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Create page dropdown component
interface CreatePageDropdownProps {
  onCreate: (type: PageType) => void;
}

function CreatePageDropdown({ onCreate }: CreatePageDropdownProps) {
  return (
    <Select onValueChange={(value) => onCreate(value as PageType)}>
      <SelectTrigger className="w-40">
        <Plus className="h-4 w-4 mr-1" />
        <SelectValue placeholder="New page..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="project">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Project
          </div>
        </SelectItem>
        <SelectItem value="feature">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Feature
          </div>
        </SelectItem>
        <SelectItem value="release">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Release
          </div>
        </SelectItem>
        <SelectItem value="roadmap">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Roadmap
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// Helper function to get type icon
function getTypeIcon(type: PageType) {
  switch (type) {
    case 'project':
      return <Package className="h-4 w-4" />;
    case 'feature':
      return <FileText className="h-4 w-4" />;
    case 'release':
      return <Target className="h-4 w-4" />;
    case 'roadmap':
      return <Folder className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}