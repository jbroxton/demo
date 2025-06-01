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

interface AssignmentItem {
  id: string;
  title: string;
}

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
 * Industry Standard Multi-Select Component
 * 
 * This follows the standard pattern used by:
 * - React Hook Form multi-select
 * - Ant Design Select (mode="multiple") 
 * - Material-UI Autocomplete (multiple)
 * - Chakra UI MultiSelect
 * 
 * Pattern: Popover + Search Input + Checkbox List + ScrollArea
 */
export function PageMultiSelectProper({
  options,
  selectedItems,
  onSelectionChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  disabled = false
}: PageMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    
    return options.filter(option =>
      option.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.type.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  // Check if an item is selected
  const isSelected = (pageId: string) => {
    return selectedItems.some(item => item.id === pageId);
  };

  // Toggle selection of an item
  const toggleSelection = (page: Page, checked: boolean) => {
    if (checked) {
      // Add to selection
      const newItem: AssignmentItem = {
        id: page.id,
        title: page.title
      };
      onSelectionChange([...selectedItems, newItem]);
    } else {
      // Remove from selection
      const newSelection = selectedItems.filter(item => item.id !== page.id);
      onSelectionChange(newSelection);
    }
    
    // Keep popover open for multi-selection
    // User can click outside or press Escape to close
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
              {emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((page) => {
                const PageIcon = getPageTypeIcon(page.type);
                const selected = isSelected(page.id);
                
                return (
                  <div
                    key={page.id}
                    className="flex items-center gap-3 rounded-sm px-3 py-2 hover:bg-white/10 cursor-pointer"
                    onClick={() => toggleSelection(page, !selected)}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => toggleSelection(page, checked as boolean)}
                      className="data-[state=checked]:bg-white data-[state=checked]:border-white"
                    />
                    
                    <PageIcon className="h-4 w-4 text-white/70 shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{page.title}</div>
                      <div className="text-xs text-white/60 capitalize">{page.type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}