"use client";

import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getPageTypeIcon } from '@/utils/page-icons';
import type { Page } from '@/types/models/Page';

interface AssignmentItem {
  id: string;
  title: string;
}

interface PageMultiSelectProps {
  /** Available pages to choose from */
  options: Page[];
  /** Currently selected items */
  selectedItems: AssignmentItem[];
  /** Callback when selection changes */
  onSelectionChange: (items: AssignmentItem[]) => void;
  /** Placeholder text for the trigger button */
  placeholder: string;
  /** Search placeholder */
  searchPlaceholder: string;
  /** Empty state message */
  emptyMessage: string;
  /** Optional className for styling */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function PageMultiSelect({
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
      option.id.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  // Check if an item is selected
  const isSelected = (pageId: string) => {
    return selectedItems.some(item => item.id === pageId);
  };

  // Toggle selection of an item
  const toggleSelection = (page: Page) => {
    console.log('toggleSelection called for:', page.title, page.id);
    const isCurrentlySelected = isSelected(page.id);
    console.log('Currently selected:', isCurrentlySelected);
    
    if (isCurrentlySelected) {
      // Remove from selection
      const newSelection = selectedItems.filter(item => item.id !== page.id);
      console.log('Removing selection, new array:', newSelection);
      onSelectionChange(newSelection);
    } else {
      // Add to selection
      const newItem: AssignmentItem = {
        id: page.id,
        title: page.title
      };
      const newSelection = [...selectedItems, newItem];
      console.log('Adding selection, new array:', newSelection);
      onSelectionChange(newSelection);
    }
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Command className="bg-[#0A0A0A]">
          <div className="flex items-center border-b border-white/10 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-white/60" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex h-10 w-full bg-transparent py-3 text-sm text-white placeholder:text-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <CommandList className="max-h-60 overflow-auto">
            <CommandEmpty className="py-6 text-center text-sm text-white/60">
              {emptyMessage}
            </CommandEmpty>
            
            <CommandGroup>
              {filteredOptions.map((page) => {
                const PageIcon = getPageTypeIcon(page.type);
                const selected = isSelected(page.id);
                
                return (
                  <CommandItem
                    key={page.id}
                    value={page.title}
                    onSelect={() => {
                      console.log('CommandItem selected:', page.title);
                      toggleSelection(page);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10 cursor-pointer"
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => {
                        console.log('Checkbox clicked for:', page.title);
                        toggleSelection(page);
                      }}
                      className="data-[state=checked]:bg-white data-[state=checked]:border-white [&_svg]:pointer-events-auto"
                      onClick={(e) => {
                        console.log('Checkbox onClick event for:', page.title);
                        e.stopPropagation();
                      }}
                    />
                    
                    <PageIcon className="h-4 w-4 text-white/70 shrink-0" />
                    
                    <div className="flex-1 truncate">
                      <div className="font-medium text-white">{page.title}</div>
                      <div className="text-xs text-white/60 capitalize">{page.type}</div>
                    </div>
                    
                    {selected && (
                      <Check className="h-4 w-4 text-white ml-auto" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}