"use client";

import React, { useState, useMemo } from 'react';
import { ChevronsUpDown, Search, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getPageTypeIcon } from '@/utils/page-icons';
import type { Page } from '@/types/models/Page';

// Generic assignment item interface
interface AssignmentItem {
  id: string;
  title: string;
}

// Generic option configuration for different object types
interface OptionConfig<T> {
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  getSearchableText: (item: T) => string[];
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  getSubtitle?: (item: T) => string;
  getIcon?: (item: T) => React.ComponentType<any>;
  getBadge?: (item: T) => { text: string; className: string } | null;
}

interface GenericMultiSelectProps<T> {
  options: T[];
  selectedItems: AssignmentItem[];
  onSelectionChange: (items: AssignmentItem[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  config: OptionConfig<T>;
  className?: string;
  disabled?: boolean;
  testId?: string;
}

// Legacy interface for backward compatibility
interface PageMultiSelectProps {
  options: Page[];
  selectedItems: AssignmentItem[];
  onSelectionChange: (items: AssignmentItem[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Generic Multi-Select Component
 * 
 * Build once, reuse everywhere! This component can handle:
 * - Pages (roadmaps, releases, etc.)
 * - Features (for feedback assignment)
 * - Any other object type via configuration
 * 
 * Pattern: Popover + Search Input + Checkbox List + ScrollArea
 */
export function GenericMultiSelect<T>({
  options,
  selectedItems,
  onSelectionChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  config,
  className,
  disabled = false,
  testId
}: GenericMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Filter options based on search using configurable search text
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    
    return options.filter(option => {
      const searchableTexts = config.getSearchableText(option);
      return searchableTexts.some(text => 
        text.toLowerCase().includes(searchValue.toLowerCase())
      );
    });
  }, [options, searchValue, config]);

  // Check if an item is selected
  const isSelected = (itemId: string) => {
    return selectedItems.some(item => item.id === itemId);
  };

  // Toggle selection of an item
  const toggleSelection = (option: T, checked: boolean) => {
    const itemId = config.getId(option);
    if (checked) {
      // Add to selection
      const newItem: AssignmentItem = {
        id: itemId,
        title: config.getTitle(option)
      };
      onSelectionChange([...selectedItems, newItem]);
    } else {
      // Remove from selection
      const newSelection = selectedItems.filter(item => item.id !== itemId);
      onSelectionChange(newSelection);
    }
    
    // Keep popover open for multi-selection
  };

  // Get trigger button text
  const getTriggerText = () => {
    if (selectedItems.length === 0) {
      return placeholder;
    }
    if (selectedItems.length === 1) {
      return selectedItems[0].title;
    }
    return `${selectedItems.length} selected`;
  };

  // Clear search when popover closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchValue('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            "bg-transparent border-white/20 text-white hover:bg-white/10",
            "data-[state=open]:bg-white/10",
            selectedItems.length === 0 && "text-white/60",
            className
          )}
          disabled={disabled}
          data-testid={testId}
        >
          <span className="truncate">{getTriggerText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white/60" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[400px] p-0 bg-[#0A0A0A] border-white/10" 
        align="start"
        sideOffset={4}
      >
        {/* Search Header */}
        <div className="flex items-center border-b border-white/10 px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 text-white/60" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-white/60 hover:text-white"
              onClick={() => setSearchValue('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Options List */}
        <ScrollArea className="max-h-60">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-white/60">
              {searchValue ? `No results found for "${searchValue}"` : emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => {
                const itemId = config.getId(option);
                const selected = isSelected(itemId);
                
                // Use custom renderer if provided, otherwise use default
                if (config.renderItem) {
                  return (
                    <div
                      key={itemId}
                      className="cursor-pointer"
                      onClick={() => toggleSelection(option, !selected)}
                    >
                      {config.renderItem(option, selected)}
                    </div>
                  );
                }
                
                // Default rendering
                const Icon = config.getIcon?.(option);
                const subtitle = config.getSubtitle?.(option);
                const badge = config.getBadge?.(option);
                
                return (
                  <div
                    key={itemId}
                    className="flex items-center gap-3 rounded-sm px-3 py-2 hover:bg-white/10 cursor-pointer"
                    onClick={() => toggleSelection(option, !selected)}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => toggleSelection(option, checked as boolean)}
                      className="data-[state=checked]:bg-white data-[state=checked]:border-white"
                    />
                    
                    {Icon && <Icon className="h-4 w-4 text-white/70 shrink-0" />}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white truncate">
                          {config.getTitle(option)}
                        </span>
                        {badge && (
                          <span className={cn("text-xs px-1.5 py-0.5 rounded", badge.className)}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      {subtitle && (
                        <div className="text-xs text-white/60">{subtitle}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {selectedItems.length > 0 && (
          <div className="border-t border-white/10 p-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{selectedItems.length} selected</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-white/60 hover:text-white"
                onClick={() => onSelectionChange([])}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Legacy PageMultiSelectProper for backward compatibility
export function PageMultiSelectProper(props: PageMultiSelectProps) {
  const pageConfig: OptionConfig<Page> = {
    getId: (page) => page.id,
    getTitle: (page) => page.title,
    getSearchableText: (page) => [page.title, page.type],
    getSubtitle: (page) => page.type,
    getIcon: (page) => getPageTypeIcon(page.type)
  };

  return (
    <GenericMultiSelect
      {...props}
      config={pageConfig}
    />
  );
}