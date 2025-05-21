'use client'

import React, { useState, useEffect } from 'react';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Map, MoreHorizontal, Trash2 } from 'lucide-react';
import { SimpleEditor } from './simple-editor';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RoadmapSpecificTabContentProps {
  roadmapId: string;
  tabId: string;
  isNew?: boolean;
}

export function RoadmapSpecificTabContent({
  roadmapId,
  tabId,
  isNew = false
}: RoadmapSpecificTabContentProps) {
  // Hooks
  const { updateTabTitle, closeTab } = useTabsQuery();
  const { currentTenant } = useAuth();
  const { 
    roadmaps, 
    getRoadmapById, 
    updateRoadmap, 
    deleteRoadmap,
    isLoading
  } = useRoadmapsQuery();
  
  // State
  const [nameValue, setNameValue] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [status, setStatus] = useState('Planning');
  const [team, setTeam] = useState('Product');
  const [period, setPeriod] = useState('Q1 2025');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Get roadmap data
  const roadmap = getRoadmapById(roadmapId);
  
  // Initialize data on component mount
  useEffect(() => {
    if (!roadmap) return;
    
    // Set name
    setNameValue(roadmap.name || '');
    
    // Set content
    if (roadmap.description) {
      try {
        // Try to parse as JSON first
        JSON.parse(roadmap.description);
        setDocumentContent(roadmap.description);
      } catch (e) {
        // If it's not JSON, create a document with the description
        const initialContent = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: roadmap.description || '' }]
            }
          ]
        };
        setDocumentContent(JSON.stringify(initialContent));
      }
    } else {
      // Initialize with a table structure for a new roadmap
      const initialContent = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: roadmap.name }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }]
          },
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initiative' }] }]
                  },
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature Name' }] }]
                  },
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }]
                  },
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Priority' }] }]
                  },
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Owner' }] }]
                  },
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goal' }] }]
                  },
                  {
                    type: 'tableHeader',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Dependencies' }] }]
                  }
                ]
              },
              {
                type: 'tableRow',
                content: Array(7).fill({
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
                })
              }
            ]
          }
        ]
      };
      setDocumentContent(JSON.stringify(initialContent));
    }
  }, [roadmap]);
  
  // Handle name changes and sync with tab title
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNameValue(newName);
    updateTabTitle(tabId, 'roadmap', newName);
  };
  
  // Handle content changes
  const handleContentChange = (content: string) => {
    setDocumentContent(content);
    handleSaveChanges();
  };
  
  // Auto-save function
  const handleSaveChanges = async () => {
    if (!roadmapId || !nameValue) return;
    
    try {
      await updateRoadmap(roadmapId, {
        name: nameValue,
        description: documentContent
      });
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save roadmap:', error);
      toast.error('Failed to save roadmap');
    }
  };
  
  // Delete roadmap handler
  const handleDeleteRoadmap = async () => {
    try {
      await deleteRoadmap(roadmapId);
      toast.success('Roadmap deleted successfully');
      closeTab(tabId);
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      toast.error('Failed to delete roadmap');
    }
    setIsDeleteDialogOpen(false);
  };
  
  // Loading state
  if (isLoading && !roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0A0A0A] text-[#a0a0a0] gap-4 roadmap-editor">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-white"></div>
        <p className="text-base font-medium text-white/70">Loading roadmap...</p>
      </div>
    );
  }
  
  // "Not found" state
  if (!roadmap) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0A0A0A] text-[#a0a0a0] gap-4 roadmap-editor">
        <Map className="h-16 w-16 text-[#232326]" />
        <p className="text-base font-medium text-white/70">Roadmap not found or not loaded yet.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] roadmap-editor">
      {/* Header section */}
      <header className="px-6 py-5 border-b border-[#1a1a1c] relative">
        {/* Document name and icon */}
        <div className="flex items-center gap-2 mb-5">
          <Map className="h-6 w-6 text-[#a0a0a0] flex-shrink-0 roadmap-editor-icon" />
          <input
            value={nameValue}
            onChange={handleNameChange}
            className="title-input"
            placeholder="Untitled Roadmap"
            spellCheck={false}
          />
        </div>
        
        {/* Dropdown controls */}
        <div className="flex flex-wrap items-center gap-3">
          <StatusSelect value={status} onChange={setStatus} />
          <TeamSelect value={team} onChange={setTeam} />
          <PeriodSelect value={period} onChange={setPeriod} />
          
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#a0a0a0] hover:bg-[rgba(147,51,234,0.1)] hover:text-[#9333EA] border-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="!bg-[#0A0A0A] !border-[#1a1a1c] shadow-lg" style={{backgroundColor: '#0A0A0A', borderColor: '#1a1a1c'}}>
                <DropdownMenuItem
                  className="text-[#a0a0a0] hover:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:text-[#9333EA] focus:bg-[rgba(147,51,234,0.1)] cursor-pointer text-red-400 focus:text-red-400"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Roadmap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {showSaveSuccess && (
          <div className={`save-indicator visible`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Saved
          </div>
        )}
      </header>
      
      {/* Editor */}
      <main className="flex-grow px-6 py-4 overflow-auto bg-[#0A0A0A] roadmap-editor-document">
        <div className="roadmap-editor-container">
          <SimpleEditor
            initialContent={documentContent}
            onChange={handleContentChange}
            placeholder="Start editing your roadmap..."
            className="h-full bg-[#0A0A0A] rounded-md"
            persistenceKey={`roadmap-${roadmapId}`}
            onBlur={handleSaveChanges}
            saveDocument={handleSaveChanges}
          />
        </div>
      </main>
      
      {/* Delete confirmation dialog */}
      <DeleteDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDeleteRoadmap}
      />
    </div>
  );
}

// Extracted sub-components to reduce nesting and improve readability

function StatusSelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="field-label">Status:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-transparent border-0 hover:bg-[#1a1a1c] hover:text-white focus:ring-0 h-7 pl-2 pr-1">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="!bg-[#0A0A0A] !border-[#1a1a1c] shadow-lg rounded-md overflow-hidden" style={{backgroundColor: '#0A0A0A', borderColor: '#1a1a1c'}}>
          <SelectItem value="Planning" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Planning</SelectItem>
          <SelectItem value="InProgress" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">In Progress</SelectItem>
          <SelectItem value="Completed" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function TeamSelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="field-label">Team:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-transparent border-0 hover:bg-[#1a1a1c] hover:text-white focus:ring-0 h-7 pl-2 pr-1">
          <SelectValue placeholder="Team" />
        </SelectTrigger>
        <SelectContent className="!bg-[#0A0A0A] !border-[#1a1a1c] shadow-lg rounded-md overflow-hidden" style={{backgroundColor: '#0A0A0A', borderColor: '#1a1a1c'}}>
          <SelectItem value="Product" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Product</SelectItem>
          <SelectItem value="Engineering" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Engineering</SelectItem>
          <SelectItem value="Design" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Design</SelectItem>
          <SelectItem value="Marketing" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Marketing</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function PeriodSelect({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="field-label">Period:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-transparent border-0 hover:bg-[#1a1a1c] hover:text-white focus:ring-0 h-7 pl-2 pr-1">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent className="!bg-[#0A0A0A] !border-[#1a1a1c] shadow-lg rounded-md overflow-hidden" style={{backgroundColor: '#0A0A0A', borderColor: '#1a1a1c'}}>
          <SelectItem value="Q1 2025" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Q1 2025</SelectItem>
          <SelectItem value="Q2 2025" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Q2 2025</SelectItem>
          <SelectItem value="Q3 2025" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Q3 2025</SelectItem>
          <SelectItem value="Q4 2025" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">Q4 2025</SelectItem>
          <SelectItem value="2025" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">2025</SelectItem>
          <SelectItem value="2026" className="hover:text-[#9333EA] focus:text-[#9333EA] hover:bg-[rgba(147,51,234,0.1)] focus:bg-[rgba(147,51,234,0.1)]">2026</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function DeleteDialog({ 
  isOpen, 
  onOpenChange, 
  onDelete 
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void, 
  onDelete: () => void 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!bg-[#0A0A0A] !border-[#1a1a1c] text-white max-w-md" style={{backgroundColor: '#0A0A0A', borderColor: '#1a1a1c'}}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Delete Roadmap</DialogTitle>
          <DialogDescription className="text-[#a0a0a0] mt-2">
            Are you sure? This cannot be undone. Features on this roadmap will no longer be associated with it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-[#0A0A0A] border-[#1a1a1c] hover:bg-[rgba(147,51,234,0.1)] text-[#a0a0a0] hover:text-[#9333EA]"
          >
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}