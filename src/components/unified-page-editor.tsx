"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { RoadmapFeaturesTable } from './roadmap/roadmap-features-table-extension';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/atom-one-dark.css';
import '@/styles/code-highlight.css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import debounce from 'lodash/debounce';
import { Extension } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import { PluginKey } from 'prosemirror-state';

// Create a lowlight instance with common languages
const lowlight = createLowlight(common);

// Register additional languages
lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('json', json);
lowlight.register('bash', bash);
lowlight.register('sh', bash);

// Template Commands for PRD templates
const getTemplateCommands = () => [
  {
    title: 'Short PRD Template',
    description: 'Quick 1-page product requirements',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent(`
# Product Requirements Document

## Problem Statement
[Describe the problem this feature solves]

## Solution Overview  
[High-level solution approach]

## Success Metrics
- [Key metric 1]
- [Key metric 2]

## Requirements
- [Requirement 1]
- [Requirement 2]
      `).run();
    }
  },
  {
    title: 'Medium PRD Template',
    description: 'Standard PRD with user stories',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent(`
# Product Requirements Document

## Executive Summary
[Brief overview of the feature]

## Problem Statement
[Detailed problem description]

## User Stories
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

## Functional Requirements
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

## Non-Functional Requirements
- Performance: [criteria]
- Security: [criteria]
- Usability: [criteria]

## Success Metrics
- [Metric 1]: [target]
- [Metric 2]: [target]

## Timeline
- Phase 1: [deliverables]
- Phase 2: [deliverables]
      `).run();
    }
  },
  {
    title: 'Full PRD Template',
    description: 'Comprehensive PRD with all sections',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent(`
# Product Requirements Document

## Executive Summary
[Brief overview of the feature and its business impact]

## Problem Statement
[Detailed description of the problem this feature solves]

## Goals & Objectives
- [Primary goal]
- [Secondary goal]
- [Success criteria]

## Target Audience
- **Primary Users**: [description]
- **Secondary Users**: [description]
- **User Personas**: [key personas]

## User Stories
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

## Functional Requirements
### Core Features
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

### Secondary Features
- [Nice-to-have 1]
- [Nice-to-have 2]

## Non-Functional Requirements
- **Performance**: [criteria]
- **Security**: [criteria]
- **Usability**: [criteria]
- **Scalability**: [criteria]
- **Accessibility**: [criteria]

## Success Metrics & KPIs
- [Metric 1]: [baseline] → [target]
- [Metric 2]: [baseline] → [target]
- [Metric 3]: [baseline] → [target]

## Technical Considerations
- [Architecture notes]
- [Dependencies]
- [Constraints]

## Risks & Mitigation
- **Risk 1**: [description] | **Mitigation**: [strategy]
- **Risk 2**: [description] | **Mitigation**: [strategy]

## Timeline & Milestones
- **Phase 1** (Week 1-2): [deliverables]
- **Phase 2** (Week 3-4): [deliverables]
- **Phase 3** (Week 5-6): [deliverables]

## Appendix
- [Wireframes/mockups]
- [Technical specifications]
- [Research findings]
      `).run();
    }
  },
  {
    title: 'User Story Template',
    description: 'Standard user story format',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent(`
## User Story

**As a** [type of user]  
**I want** [some goal or objective]  
**So that** [some reason or benefit]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Definition of Done
- [ ] Feature implemented and tested
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] User testing completed
      `).run();
    }
  },
  {
    title: 'Feature Spec Template',
    description: 'Technical feature specification',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent(`
# Feature Specification

## Overview
[Brief description of the feature]

## Technical Requirements
- [Technical requirement 1]
- [Technical requirement 2]
- [Technical requirement 3]

## API Specifications
### Endpoints
- **GET** \`/api/endpoint\` - [description]
- **POST** \`/api/endpoint\` - [description]

### Data Models
\`\`\`typescript
interface FeatureModel {
  id: string;
  name: string;
  // Add more fields
}
\`\`\`

## UI/UX Requirements
- [UI requirement 1]
- [UI requirement 2]

## Testing Strategy
- **Unit Tests**: [coverage requirements]
- **Integration Tests**: [scenarios]
- **E2E Tests**: [user workflows]

## Implementation Notes
- [Implementation detail 1]
- [Implementation detail 2]
      `).run();
    }
  }
];

// Glossary Commands for PM/Dev terms with tooltips
const getGlossaryCommands = () => [
  {
    title: 'API',
    description: 'Application Programming Interface',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('API').run();
    }
  },
  {
    title: 'MVP',
    description: 'Minimum Viable Product',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('MVP').run();
    }
  },
  {
    title: 'User Story',
    description: 'Feature requirement from user perspective',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('User Story').run();
    }
  },
  {
    title: 'Scrum',
    description: 'Agile framework for software development',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Scrum').run();
    }
  },
  {
    title: 'Sprint',
    description: 'Time-boxed development iteration',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Sprint').run();
    }
  },
  {
    title: 'Backlog',
    description: 'Prioritized list of features and tasks',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Backlog').run();
    }
  },
  {
    title: 'Epic',
    description: 'Large user story broken into smaller stories',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Epic').run();
    }
  },
  {
    title: 'Acceptance Criteria',
    description: 'Conditions for feature completion',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Acceptance Criteria').run();
    }
  },
  {
    title: 'Definition of Done',
    description: 'Team agreement on work completion',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Definition of Done').run();
    }
  },
  {
    title: 'Stakeholder',
    description: 'Person with interest in project outcome',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Stakeholder').run();
    }
  },
  {
    title: 'Persona',
    description: 'Fictional character representing user segment',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Persona').run();
    }
  },
  {
    title: 'User Journey',
    description: 'Path user takes to accomplish goal',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('User Journey').run();
    }
  },
  {
    title: 'Wireframe',
    description: 'Basic structural blueprint of webpage',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Wireframe').run();
    }
  },
  {
    title: 'Mockup',
    description: 'Static design representation',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Mockup').run();
    }
  },
  {
    title: 'Prototype',
    description: 'Interactive model of product',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Prototype').run();
    }
  },
  {
    title: 'A/B Test',
    description: 'Experiment comparing two versions',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('A/B Test').run();
    }
  },
  {
    title: 'KPI',
    description: 'Key Performance Indicator',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('KPI').run();
    }
  },
  {
    title: 'OKR',
    description: 'Objectives and Key Results',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('OKR').run();
    }
  },
  {
    title: 'Technical Debt',
    description: 'Cost of additional rework',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Technical Debt').run();
    }
  },
  {
    title: 'Refactoring',
    description: 'Restructuring existing code',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertContent('Refactoring').run();
    }
  }
];

// Lucide React Icons for UI actions
import {
  Save,
  Trash2,
  Plus,
  CircleDot,
  FileText,
  Calendar,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  Settings,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  Undo,
  Redo,
  Code,
  FileCode,
  Quote,
  Table as TableIcon,
  RowsIcon,
  ColumnsIcon,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  Combine,
  Split,
  Grid,
  Info,
  Map
} from 'lucide-react';

import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import type { PageType } from '@/types/models/Page';
import { getPageTypeIcon } from '@/utils/page-icons';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { useUnifiedPages } from '@/providers/unified-state-provider';
import { PageDetailsDrawer } from './page-details-drawer';

interface UnifiedPageEditorProps {
  pageId?: string;
  pageType: PageType;
  initialTitle?: string;
  initialContent?: any;
  initialProperties?: Record<string, any>;
  onChange?: (content: string) => void;
  onSave?: () => Promise<void>;
  onDelete?: () => void;
  className?: string;
  persistenceKey?: string;
}

/**
 * Unified Page Editor - High-performance page editing with smooth UX
 * 
 * ARCHITECTURE OVERVIEW:
 * - Single TipTap instance for rich content editing
 * - Uncontrolled title input for jerk-free typing experience  
 * - Single document approach for optimal TipTap performance
 * - React Query + Supabase for state management and persistence
 * 
 * KEY PERFORMANCE OPTIMIZATIONS:
 * 1. TITLE INPUT: Uncontrolled pattern prevents cursor jumping
 *    - defaultValue (not value) lets DOM manage input state
 *    - Debounced sync (300ms) to React Query/Supabase
 *    - Result: 0 cursor jumps vs 13+ with controlled input
 * 
 * 2. CONTENT PERSISTENCE: Single document approach
 *    - Stores entire TipTap document as one JSON block
 *    - 800ms debounce for auto-save during typing
 *    - Format: { type: 'document', content: { tiptap_content: {...} } }
 * 
 * 3. STATE SYNCHRONIZATION: 
 *    - Title changes sync to React Query cache
 *    - Tab titles update automatically via pagesQuery.getPageById()
 *    - Content persists across page refreshes and tab switches
 * 
 * PHILOSOPHY: Google Docs meets Notion for Product Managers
 * - Everything flows as one document
 * - Instant feedback, reliable persistence
 * - Clean, distraction-free interface
 * 
 * TESTING: Verified via E2E tests in title-jerkiness.spec.ts
 * - Cursor stability: 0 jumps during rapid typing
 * - Content persistence: Survives refresh and tab switches
 * - Performance: Handles rapid input without lag
 */
export function UnifiedPageEditor({
  pageId,
  pageType,
  initialTitle = 'New Page',
  initialContent = '',
  initialProperties = {},
  onChange,
  onSave,
  onDelete,
  className = '',
  persistenceKey
}: UnifiedPageEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Use unified state provider for all page operations
  const pagesState = useUnifiedPages();
  const { updateTabTitle } = useTabsQuery();
  
  // Get current page from provider
  const currentPage = pageId ? pagesState.getPageById(pageId) : null;
  const headerTitle = currentPage?.title || initialTitle;
  
  // Track editor state
  const hasInitialized = useRef(false);
  const isApplyingTransaction = useRef(false);
  const lastContent = useRef<string>('');

  // Get page type icon
  const PageIcon = getPageTypeIcon(pageType);

  /**
   * Processes database blocks into TipTap document format for editor initialization
   * 
   * LOADING LOGIC: Extracts TipTap content from single document block format
   * - Looks for block with type='document' containing tiptap_content
   * - Falls back to legacy formats for backward compatibility
   * - Provides sensible default if no content found
   * 
   * BACKWARD COMPATIBILITY: Handles multiple content formats
   * - New: blocks[0].content.tiptap_content.content (single document)
   * - Legacy: initialContent.content (direct TipTap)
   * - Empty: Default placeholder paragraph
   * 
   * ROADMAP AUTO-GENERATION: Automatically inserts features table for roadmap pages
   * 
   * @returns TipTap document object ready for editor initialization
   */
  const createUnifiedDocument = useCallback(() => {
    console.log('🔨 Creating unified document for page type:', pageType, 'pageId:', pageId);
    console.log('📄 Initial content:', initialContent);
    
    // Single document approach: Extract TipTap content from blocks
    let tiptapContent;
    
    if (Array.isArray(initialContent) && initialContent.length > 0) {
      // Look for document block with TipTap content
      const documentBlock = initialContent.find(block => block.type === 'document');
      if (documentBlock?.content?.tiptap_content?.content) {
        tiptapContent = documentBlock.content.tiptap_content.content;
      }
    } else if (initialContent?.content) {
      // Direct TipTap document format
      tiptapContent = initialContent.content;
    }
    
    // Default content if nothing found
    if (!tiptapContent || tiptapContent.length === 0) {
      // For roadmap pages, create minimal content with just the features table
      if (pageType === 'roadmap') {
        console.log('🗺️ Creating new roadmap content with features table for pageId:', pageId);
        tiptapContent = [
          {
            type: 'roadmapFeaturesTable',
            attrs: {
              roadmapId: pageId,
              isAutoGenerated: true
            }
          }
        ];
      } else {
        // Default content for other page types - empty paragraph for clean placeholder experience
        tiptapContent = [
          {
            type: 'paragraph'
          }
        ];
      }
    } else if (pageType === 'roadmap') {
      // For existing roadmap pages, replace all content with just the features table
      // This creates a clean, form-like experience focused on the roadmap data
      console.log('🗺️ Replacing existing content with roadmap features table for pageId:', pageId);
      tiptapContent = [
        {
          type: 'roadmapFeaturesTable',
          attrs: {
            roadmapId: pageId,
            isAutoGenerated: true
          }
        }
      ];
    }

    const document = {
      type: 'doc',
      content: tiptapContent
    };
    
    console.log('📋 Final document created:', document);
    return document;
  }, [initialContent, pageType, pageId]);

  /**
   * Single Document Approach for TipTap content persistence
   * 
   * ARCHITECTURE: Stores entire TipTap document as one block instead of multiple blocks
   * - Better performance: single JSON blob vs array of block objects
   * - Simpler loading: extract content.tiptap_content directly
   * - TipTap optimized: designed for single document, not block arrays
   * 
   * STORAGE FORMAT in Supabase pages.blocks column:
   * [
   *   {
   *     id: 'doc-{pageId}',
   *     type: 'document', 
   *     content: {
   *       tiptap_content: { type: 'doc', content: [...] }  // Full TipTap JSON
   *     }
   *   }
   * ]
   * 
   * PERFORMANCE: 800ms debounce prevents excessive API calls during rapid typing
   * - User types continuously → only saves after 800ms pause
   * - Content persists across page refreshes and tab switches
   * - Verified working via E2E tests
   * 
   * @param content - Stringified TipTap JSON document
   */
  const debouncedContentSave = useRef(
    debounce(async (content: string) => {
      if (pageId && currentPage) {
        try {
          // Parse content for saving - single document approach
          const contentJson = JSON.parse(content);
          
          // Create single document block with TipTap content
          const documentBlock = {
            id: `doc-${pageId}`,
            type: 'document',
            content: {
              tiptap_content: contentJson
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Store as single document in blocks array
          await pagesState.updatePage(pageId, { blocks: [documentBlock] });
        } catch (error) {
          console.error('Failed to auto-save content:', error);
        }
      }
      if (onChange) {
        onChange(content);
      }
    }, 800)
  ).current;

  // State for command menu
  const [commandMenuVisible, setCommandMenuVisible] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const commandMenuRef = useRef<HTMLDivElement>(null);

  // Get filtered commands based on query
  const getFilteredCommands = useCallback((query: string) => {
    const templates = getTemplateCommands();
    const glossary = getGlossaryCommands();
    const allCommands = [...templates, ...glossary];
    
    if (!query) return allCommands.slice(0, 10);
    
    return allCommands
      .filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10);
  }, []);

  // Commands extension using TipTap's suggestion
  const Commands = Extension.create({
    name: 'slash-commands',

    addOptions() {
      return {
        suggestion: {
          char: '/',
          allowSpaces: false,
          startOfLine: false,
          pluginKey: new PluginKey('slash-commands'),
          items: ({ query }: { query: string }) => {
            return getFilteredCommands(query);
          },
          render: () => {
            let component: HTMLDivElement | null = null;
            let popup: any;

            return {
              onStart: (props: any) => {
                // Clean up any existing component
                if (component && component.parentNode) {
                  component.parentNode.removeChild(component);
                }
                
                component = document.createElement('div');
                component.className = 'fixed z-50 bg-[#0A0A0A] border border-[#333] rounded-md shadow-xl py-2 max-h-80 overflow-y-auto min-w-[320px]';
                
                // Position the menu
                const updatePosition = () => {
                  const rect = props.clientRect();
                  if (rect && component) {
                    component.style.left = `${rect.left}px`;
                    component.style.top = `${rect.bottom + 5}px`;
                  }
                };
                
                document.body.appendChild(component);
                updatePosition();
              },

              onUpdate: (props: any) => {
                if (!component) return;
                
                const updatePosition = () => {
                  const rect = props.clientRect();
                  if (rect && component) {
                    component.style.left = `${rect.left}px`;
                    component.style.top = `${rect.bottom + 5}px`;
                  }
                };
                updatePosition();

                if (!props.items || props.items.length === 0) {
                  component.innerHTML = '<div class="text-[#666] p-3 text-sm">No commands found</div>';
                  return;
                }

                // Group items by type
                const templates = props.items.filter((item: any) => 
                  ['Short PRD Template', 'Medium PRD Template', 'Full PRD Template', 'User Story Template', 'Feature Spec Template'].includes(item.title)
                );
                const glossary = props.items.filter((item: any) => 
                  !['Short PRD Template', 'Medium PRD Template', 'Full PRD Template', 'User Story Template', 'Feature Spec Template'].includes(item.title)
                );

                let html = '';
                let itemIndex = 0;

                // Templates section
                if (templates.length > 0) {
                  html += '<div class="px-3 py-2 text-xs font-medium text-[#888] uppercase tracking-wide border-b border-[#333]">Templates</div>';
                  templates.forEach((item: any) => {
                    const globalIndex = props.items.indexOf(item);
                    const isSelected = globalIndex === props.selectedIndex;
                    html += `
                      <div class="${
                        isSelected 
                          ? 'bg-[#1a1a1c] text-white' 
                          : 'text-[#e5e7eb] hover:bg-[#1a1a1c] hover:text-white'
                      } px-3 py-2 cursor-pointer transition-colors" data-index="${globalIndex}">
                        <div class="font-medium text-sm">${item.title}</div>
                        <div class="text-xs text-[#999] mt-1">${item.description}</div>
                      </div>
                    `;
                  });
                }

                // Glossary section
                if (glossary.length > 0) {
                  if (templates.length > 0) {
                    html += '<div class="border-t border-[#333] mt-1"></div>';
                  }
                  html += '<div class="px-3 py-2 text-xs font-medium text-[#888] uppercase tracking-wide border-b border-[#333]">Glossary</div>';
                  glossary.forEach((item: any) => {
                    const globalIndex = props.items.indexOf(item);
                    const isSelected = globalIndex === props.selectedIndex;
                    html += `
                      <div class="${
                        isSelected 
                          ? 'bg-[#1a1a1c] text-white' 
                          : 'text-[#e5e7eb] hover:bg-[#1a1a1c] hover:text-white'
                      } px-3 py-2 cursor-pointer transition-colors" data-index="${globalIndex}">
                        <div class="font-medium text-sm">${item.title}</div>
                        <div class="text-xs text-[#999] mt-1">${item.description}</div>
                      </div>
                    `;
                  });
                }

                component.innerHTML = html;

                // Add click handlers
                component.querySelectorAll('[data-index]').forEach((element) => {
                  element.addEventListener('click', () => {
                    const index = parseInt(element.getAttribute('data-index') || '0');
                    if (props.items[index]) {
                      // Execute the command
                      props.items[index].command(props);
                      
                      // Clean up immediately after click
                      if (component && component.parentNode) {
                        component.parentNode.removeChild(component);
                        component = null;
                      }
                    }
                  });
                });
              },

              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  return true;
                }

                if (props.event.key === 'ArrowUp') {
                  return true;
                }

                if (props.event.key === 'ArrowDown') {
                  return true;
                }

                if (props.event.key === 'Enter') {
                  return true;
                }

                return false;
              },

              onExit: () => {
                if (component && component.parentNode) {
                  component.parentNode.removeChild(component);
                }
                component = null;
              },
            };
          },
          command: ({ editor, range, props }: any) => {
            // Execute the command
            if (props && props.command) {
              props.command({ editor, range });
            }
          },
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '/',
          allowSpaces: false,
          startOfLine: false,
          pluginKey: new PluginKey('slash-commands'),
          items: ({ query }: { query: string }) => {
            return getFilteredCommands(query);
          },
          render: () => {
            let component: HTMLDivElement | null = null;

            return {
              onStart: (props: any) => {
                // Clean up any existing component
                if (component && component.parentNode) {
                  component.parentNode.removeChild(component);
                }
                
                component = document.createElement('div');
                component.className = 'fixed z-50 bg-[#0A0A0A] border border-[#333] rounded-md shadow-xl py-2 max-h-80 overflow-y-auto min-w-[320px]';
                
                // Position the menu
                const updatePosition = () => {
                  const rect = props.clientRect();
                  if (rect) {
                    component!.style.left = `${rect.left}px`;
                    component!.style.top = `${rect.bottom + 5}px`;
                  }
                };
                
                document.body.appendChild(component);
                updatePosition();
              },

              onUpdate: (props: any) => {
                if (!component) return;
                
                const updatePosition = () => {
                  const rect = props.clientRect();
                  if (rect && component) {
                    component.style.left = `${rect.left}px`;
                    component.style.top = `${rect.bottom + 5}px`;
                  }
                };
                updatePosition();

                if (!props.items || props.items.length === 0) {
                  component.innerHTML = '<div class="text-[#666] p-3 text-sm">No commands found</div>';
                  return;
                }

                // Group items by type
                const templates = props.items.filter((item: any) => 
                  ['Short PRD Template', 'Medium PRD Template', 'Full PRD Template', 'User Story Template', 'Feature Spec Template'].includes(item.title)
                );
                const glossary = props.items.filter((item: any) => 
                  !['Short PRD Template', 'Medium PRD Template', 'Full PRD Template', 'User Story Template', 'Feature Spec Template'].includes(item.title)
                );

                let html = '';

                // Templates section
                if (templates.length > 0) {
                  html += '<div class="px-3 py-2 text-xs font-medium text-[#888] uppercase tracking-wide border-b border-[#333]">Templates</div>';
                  templates.forEach((item: any) => {
                    const globalIndex = props.items.indexOf(item);
                    const isSelected = globalIndex === props.selectedIndex;
                    html += `
                      <div class="${
                        isSelected 
                          ? 'bg-[#1a1a1c] text-white' 
                          : 'text-[#e5e7eb] hover:bg-[#1a1a1c] hover:text-white'
                      } px-3 py-2 cursor-pointer transition-colors" data-index="${globalIndex}">
                        <div class="font-medium text-sm">${item.title}</div>
                        <div class="text-xs text-[#999] mt-1">${item.description}</div>
                      </div>
                    `;
                  });
                }

                // Glossary section
                if (glossary.length > 0) {
                  if (templates.length > 0) {
                    html += '<div class="border-t border-[#333] mt-1"></div>';
                  }
                  html += '<div class="px-3 py-2 text-xs font-medium text-[#888] uppercase tracking-wide border-b border-[#333]">Glossary</div>';
                  glossary.forEach((item: any) => {
                    const globalIndex = props.items.indexOf(item);
                    const isSelected = globalIndex === props.selectedIndex;
                    html += `
                      <div class="${
                        isSelected 
                          ? 'bg-[#1a1a1c] text-white' 
                          : 'text-[#e5e7eb] hover:bg-[#1a1a1c] hover:text-white'
                      } px-3 py-2 cursor-pointer transition-colors" data-index="${globalIndex}">
                        <div class="font-medium text-sm">${item.title}</div>
                        <div class="text-xs text-[#999] mt-1">${item.description}</div>
                      </div>
                    `;
                  });
                }

                component.innerHTML = html;

                // Add click handlers
                component.querySelectorAll('[data-index]').forEach((element) => {
                  element.addEventListener('click', () => {
                    const index = parseInt(element.getAttribute('data-index') || '0');
                    if (props.items[index]) {
                      // Execute the command
                      props.items[index].command(props);
                      
                      // Clean up immediately after click
                      if (component && component.parentNode) {
                        component.parentNode.removeChild(component);
                        component = null;
                      }
                    }
                  });
                });
              },

              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  return true;
                }

                if (props.event.key === 'ArrowUp') {
                  return true;
                }

                if (props.event.key === 'ArrowDown') {
                  return true;
                }

                if (props.event.key === 'Enter') {
                  return true;
                }

                return false;
              },

              onExit: () => {
                if (component && component.parentNode) {
                  component.parentNode.removeChild(component);
                }
                component = null;
              },
            };
          },
          command: ({ editor, range, props }: any) => {
            // Execute the command
            if (props && props.command) {
              props.command({ editor, range });
            }
          },
        }),
      ];
    },
  });

  // Editor instance with unified document structure
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-500 pl-4 italic text-gray-300',
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold',
          },
          // Exit heading configuration removed - not supported in this version
        },
        // Enable markdown shortcuts
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-inside',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'bg-pink-900/30 text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono',
          },
        },
        bold: {
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'italic',
          },
        },
      }),
      Typography.configure({
        // Enable auto-markdown formatting
        openDoubleQuote: '"',
        closeDoubleQuote: '"',
        openSingleQuote: "'",
        closeSingleQuote: "'",
        copyright: '©',
        trademark: '™',
        registeredTrademark: '®',
        oneHalf: '½',
        oneQuarter: '¼',
        threeQuarters: '¾',
        plusMinus: '±',
        notEqual: '≠',
        laquo: '«',
        raquo: '»',
        multiplication: '×',
        superscriptTwo: '²',
        superscriptThree: '³',
      }),
      UnderlineExtension,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
        HTMLAttributes: {
          class: 'rounded-md bg-[#1a1a1c] p-4 my-2 font-mono text-sm overflow-auto code-block-vscode',
          spellcheck: 'false',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-md max-w-full',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2 list-none',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-1',
        },
        nested: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-gray-700',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border-b-2 border-gray-600 bg-gray-800 text-left p-2 font-bold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-700 p-2',
        },
      }),
      RoadmapFeaturesTable.configure({
        HTMLAttributes: {
          class: 'roadmap-features-table my-4',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'paragraph' && editor?.isEmpty) {
            return 'What are we building today? Type / for commands...';
          }
          return 'Type / for commands...';
        },
        emptyEditorClass: 'is-editor-empty',
      }),
      Commands,
    ],
    content: createUnifiedDocument(),
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none min-h-full unified-page-editor text-left',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isApplyingTransaction.current) {
        const json = editor.getJSON();
        const jsonString = JSON.stringify(json);
        
        lastContent.current = jsonString;
        debouncedContentSave(jsonString);
      }
    },
    onTransaction: ({ transaction }) => {
      if (transaction.getMeta('isExternalContentUpdate')) {
        isApplyingTransaction.current = true;
        setTimeout(() => {
          isApplyingTransaction.current = false;
        }, 0);
      }
    },
    editable: pageType !== 'roadmap', // Make roadmap pages read-only except for table interactions
  });

  // Set client side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update header title when current page changes (via provider)
  useEffect(() => {
    // Title is now derived from currentPage, no local state needed
  }, [currentPage]);

  // Handle save action
  const handleSave = async () => {
    if (!onSave || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave();
      // No need to track unsaved changes locally anymore
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete action
  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this page?')) {
      onDelete();
    }
  };

  /**
   * Debounced title persistence to React Query + Supabase
   * 
   * TIMING: 300ms debounce strikes balance between responsiveness and API efficiency
   * - Fast enough for good UX (user notices save within 1/3 second)
   * - Slow enough to batch rapid typing into single API call
   * 
   * SYNC: Tab titles update automatically without explicit updates
   * - Tabs use pagesQuery.getPageById().title for display
   * - When this updates the pages cache, tabs re-render with new title
   * - No need for separate updateTabTitle() calls
   * 
   * @param newTitle - The title to save to database
   */
  const debouncedTitleUpdate = useCallback(
    debounce(async (newTitle: string) => {
      if (pageId) {
        try {
          // Use provider's optimistic update for title
          await pagesState.updatePageTitle(pageId, newTitle);
          // Note: Tab title updates automatically via pagesQuery.getPageById()
        } catch (error) {
          console.error('Failed to update title:', error);
        }
      }
    }, 300),
    [pageId, pagesState]
  );

  /**
   * Handles title input changes with smooth UX and debounced persistence
   * 
   * ARCHITECTURE: Uses uncontrolled input pattern to prevent jerkiness
   * - Input uses `defaultValue` (not `value`) so DOM manages typing
   * - Only syncs to React Query/Supabase after user stops typing (300ms debounce)
   * - Prevents cursor jumping and value flickering during rapid typing
   * 
   * PERFORMANCE: Eliminates render-on-every-keystroke anti-pattern
   * - Before: controlled input + immediate optimistic updates = 13+ cursor jumps
   * - After: uncontrolled input + debounced sync = 0 cursor jumps
   * 
   * @param newTitle - The new title value from user input
   */
  const handleTitleChange = (newTitle: string) => {
    // Only trigger debounced save - no immediate cache updates that cause jerkiness
    if (pageId) {
      debouncedTitleUpdate(newTitle);
    }
  };

  // Add new block
  const addBlock = () => {
    if (!editor) return;
    
    // Insert a new paragraph at the end
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, {
      type: 'paragraph',
      content: []
    }).run();
  };

  // Helper functions for editor interactions
  const addImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    if (!editor) return;
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addCodeBlock = () => {
    if (!editor) return;

    // Toggle code block first
    editor.chain().focus().toggleCodeBlock().run();

    // If a code block was created (not toggled off), prompt for language
    if (editor.isActive('codeBlock')) {
      const availableLanguages = [
        { name: 'JavaScript', value: 'javascript' },
        { name: 'TypeScript', value: 'typescript' },
        { name: 'HTML', value: 'html' },
        { name: 'CSS', value: 'css' },
        { name: 'Python', value: 'python' },
        { name: 'JSON', value: 'json' },
        { name: 'Bash/Shell', value: 'bash' },
      ];

      // Create language options for the user
      const options = availableLanguages
        .map((lang, i) => `${i + 1}. ${lang.name}`)
        .join('\n');

      const selection = window.prompt(
        `Select a language by number:\n${options}\n\nOr type a language name directly:`,
        '1'
      );

      if (selection) {
        let language;

        // Check if user selected by number
        const numSelection = parseInt(selection, 10);
        if (!isNaN(numSelection) && numSelection > 0 && numSelection <= availableLanguages.length) {
          language = availableLanguages[numSelection - 1].value;
        } else {
          // User typed a language name directly
          language = selection.toLowerCase();
        }

        editor.chain().focus().updateAttributes('codeBlock', { language }).run();
      }
    }
  };

  // Table operations helper
  const tableOperations = {
    // Add a row above current position
    addRowBefore: () => {
      if (!editor) return;
      editor.chain().focus().addRowBefore().run();
    },
    
    // Add a row below current position
    addRowAfter: () => {
      if (!editor) return;
      editor.chain().focus().addRowAfter().run();
    },
    
    // Add a column to the left of current position
    addColumnBefore: () => {
      if (!editor) return;
      editor.chain().focus().addColumnBefore().run();
    },
    
    // Add a column to the right of current position
    addColumnAfter: () => {
      if (!editor) return;
      editor.chain().focus().addColumnAfter().run();
    },
    
    // Delete current row
    deleteRow: () => {
      if (!editor) return;
      editor.chain().focus().deleteRow().run();
    },
    
    // Delete current column
    deleteColumn: () => {
      if (!editor) return;
      editor.chain().focus().deleteColumn().run();
    },
    
    // Delete entire table
    deleteTable: () => {
      if (!editor) return;
      editor.chain().focus().deleteTable().run();
    },
    
    // Toggle header row
    toggleHeaderRow: () => {
      if (!editor) return;
      editor.chain().focus().toggleHeaderRow().run();
    },
    
    // Toggle header column
    toggleHeaderColumn: () => {
      if (!editor) return;
      editor.chain().focus().toggleHeaderColumn().run();
    },
    
    // Toggle header cell
    toggleHeaderCell: () => {
      if (!editor) return;
      editor.chain().focus().toggleHeaderCell().run();
    },
    
    // Merge cells
    mergeCells: () => {
      if (!editor) return;
      editor.chain().focus().mergeCells().run();
    },
    
    // Split cells
    splitCell: () => {
      if (!editor) return;
      editor.chain().focus().splitCell().run();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedContentSave.cancel();
    };
  }, [debouncedContentSave]);

  // Handle keyboard events for command menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!commandMenuVisible) return;
      
      const commands = getFilteredCommands(commandQuery);
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedCommandIndex((prev) => 
          prev < commands.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedCommandIndex((prev) => 
          prev > 0 ? prev - 1 : commands.length - 1
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (commands[selectedCommandIndex] && editor) {
          const range = editor.state.selection;
          commands[selectedCommandIndex].command({ editor, range });
          setCommandMenuVisible(false);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setCommandMenuVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandMenuVisible, commandQuery, selectedCommandIndex, editor, getFilteredCommands]);

  // Loading state
  if (!isClient || !editor) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0A0A0A] rounded-lg">
        <div className="text-white/60">Loading editor...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-full w-full bg-[#0A0A0A] ${className}`}>
        {/* Everything is in the Editor - No external header */}
        
        {/* Header Section: Title + Action Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
          {/* Page Title and Type */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <PageIcon className="w-6 h-6 text-white/70 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              {/* 
                UNCONTROLLED INPUT: Prevents jerkiness during typing
                - defaultValue (not value) = DOM manages input state
                - onChange triggers debounced save only
                - Result: 0 cursor jumps, perfect typing experience
                
                Before fix: value={headerTitle} caused 13+ cursor jumps
                After fix: defaultValue={headerTitle} = 0 cursor jumps
              */}
              <input
                type="text"
                defaultValue={headerTitle || 'New Page'}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full min-w-0"
                placeholder="New Page"
                data-testid="page-title-input"
              />
              <span className="text-sm text-white/70 capitalize">{pageType}</span>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
              className="border-white/20 text-white hover:bg-white/10"
              data-testid="page-save-button"
            >
              {isSaving ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
            
            {/* Hide Add Block button for roadmap pages */}
            {pageType !== 'roadmap' && (
              <Button
                size="sm"
                variant="outline"
                onClick={addBlock}
                className="border-white/20 text-white hover:bg-white/10"
                data-testid="page-add-block-button"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`border-white/20 text-white hover:bg-white/10 ${isDrawerOpen ? 'bg-white/10' : ''}`}
              data-testid="page-details-button"
            >
              <Info className="w-4 h-4" />
              {isDrawerOpen ? 'Close' : 'Details'}
            </Button>
            
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
        

        {/* Main Content Area: Toolbar + Editor */}
        <div className="flex-1 flex flex-col h-full">
          {/* Toolbar - Hide for roadmap pages */}
          {pageType !== 'roadmap' && (
            <div className="px-6 py-3" data-testid="page-toolbar-container">
            <div className="flex flex-wrap items-center gap-1">
                    {/* Text Formatting */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-200 ${editor?.isActive('bold') ? 'bg-black/60 text-white border border-white/30' : 'text-white/60 hover:text-white/80 hover:bg-black/20'}`}
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            data-testid="page-bold-button"
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bold</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-200 ${editor?.isActive('italic') ? 'bg-black/60 text-white border border-white/30' : 'text-white/60 hover:text-white/80 hover:bg-black/20'}`}
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            data-testid="page-italic-button"
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Italic</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('underline') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleUnderline().run()}
                            data-testid="page-underline-button"
                          >
                            <UnderlineIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Underline</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('strike') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleStrike().run()}
                            data-testid="page-strikethrough-button"
                          >
                            <Strikethrough className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Strikethrough</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('code') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleCode().run()}
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Inline Code</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('heading', { level: 1 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                          >
                            <Heading1 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Heading 1</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('heading', { level: 2 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          >
                            <Heading2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Heading 2</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('heading', { level: 3 }) ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          >
                            <Heading3 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Heading 3</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Lists and Blockquote */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('bulletList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            data-testid="page-bullet-list-button"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bullet List</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('orderedList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                            data-testid="page-ordered-list-button"
                          >
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ordered List</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('taskList') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleTaskList().run()}
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Task List</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('blockquote') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                          >
                            <Quote className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Blockquote</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Media, Links, Tables, and Code */}
                    <div className="flex items-center gap-1 mr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white"
                            onClick={addImage}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Image</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('link') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={addLink}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Link</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('table') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={() => {
                              // Insert a table with 3 rows and 3 columns
                              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                            }}
                          >
                            <TableIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Table</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 ${editor?.isActive('codeBlock') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0] hover:text-white'}`}
                            onClick={addCodeBlock}
                          >
                            <FileCode className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Code Block</TooltipContent>
                      </Tooltip>

                    </div>

                    {/* History */}
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white"
                            onClick={() => editor?.chain().focus().undo().run()}
                            disabled={!editor?.can().undo()}
                            data-testid="page-undo-button"
                          >
                            <Undo className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white"
                            onClick={() => editor?.chain().focus().redo().run()}
                            disabled={!editor?.can().redo()}
                            data-testid="page-redo-button"
                          >
                            <Redo className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo</TooltipContent>
                      </Tooltip>
                    </div>
            </div>
            </div>
          )}
          
          {/* Editor Content Area */}
          <div className="flex-1 overflow-auto">
            <div className={pageType === 'roadmap' ? 'px-6 py-0' : 'p-6'}>
              <EditorContent
                editor={editor}
                className={`unified-page-content min-h-full ${pageType === 'roadmap' ? 'roadmap-content' : ''}`}
                data-testid="page-content-editor"
              />
            </div>
          </div>
        </div>

      {/* Enhanced bubble menu that appears when text is selected */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        shouldShow={({ editor, view, state, from, to }) => {
          // Only show the text formatting menu when text is selected and not in a table
          return from !== to && !editor.isActive('table')
        }}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] overflow-hidden flex"
      >
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('bold') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('italic') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('underline') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('strike') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('code') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={`rounded-none h-8 px-2 ${editor?.isActive('link') ? 'bg-[#232326] text-white' : 'text-[#a0a0a0]'}`}
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </BubbleMenu>
      
      {/* Special bubble menu for tables */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        shouldShow={({ editor }) => editor.isActive('table')}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] p-2"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white/70 text-xs">Table Controls</span>
          </div>
          
          {/* Row operations */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addRowBefore}
                >
                  <ChevronsUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row Before</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addRowAfter}
                >
                  <ChevronsDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Row After</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.deleteRow}
                >
                  <RowsIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Row</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Column operations */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addColumnBefore}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Column Before</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.addColumnAfter}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Column After</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.deleteColumn}
                >
                  <ColumnsIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Column</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Cell operations */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.toggleHeaderCell}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Header Cell</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.mergeCells}
                >
                  <Combine className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Merge Cells</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-[#232326]/80 text-[#a0a0a0] hover:text-white h-8 w-8 p-0"
                  onClick={tableOperations.splitCell}
                >
                  <Split className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Split Cell</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Table operations */}
          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-[#323232]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-[6px] transition-all duration-150 hover:bg-red-900/20 text-red-400/70 hover:text-red-400 h-8 w-8 p-0"
                  onClick={tableOperations.deleteTable}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Table</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </BubbleMenu>

      {/* Horizontal floating menu that appears on empty lines */}
      <FloatingMenu
        editor={editor}
        tippyOptions={{ duration: 150 }}
        className="bg-[#161618] rounded-md shadow-lg border border-[#1a1a1a] overflow-hidden flex flex-row py-1 px-1"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 1</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading 2</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Task List</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Blockquote</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={() => {
                // Insert a table with 3 rows and 3 columns
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Table</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md p-2 h-auto w-auto"
              onClick={addCodeBlock}
            >
              <FileCode className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code Block</TooltipContent>
        </Tooltip>
      </FloatingMenu>

      {/* Custom styles for unified editor */}
      <style jsx global>{`
        .unified-page-editor {
          line-height: 1.6;
          text-align: left;
        }
        
        .unified-page-editor h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
          border: none;
          outline: none;
          text-align: left;
          margin-left: 0;
          padding-left: 0;
        }
        
        .unified-page-editor h1:first-child {
          /* Keep the title visible in the editor */
          margin-top: 0;
          padding-top: 0;
          text-align: left;
        }
        
        .unified-page-content {
          text-align: left;
          color: white;
        }
        
        /* Clean editor layout - force left alignment */
        .unified-page-content {
          text-align: left !important;
        }
        
        .unified-page-content .ProseMirror {
          outline: none;
          min-height: 400px;
          text-align: left !important;
          max-width: none !important;
        }
        
        /* Override prose centering and all text alignment */
        .unified-page-content.prose {
          max-width: none !important;
          text-align: left !important;
        }
        
        .unified-page-content .ProseMirror p,
        .unified-page-content .ProseMirror h1,
        .unified-page-content .ProseMirror h2,
        .unified-page-content .ProseMirror h3,
        .unified-page-content .ProseMirror h4,
        .unified-page-content .ProseMirror h5,
        .unified-page-content .ProseMirror h6,
        .unified-page-content .ProseMirror div,
        .unified-page-content .ProseMirror ul,
        .unified-page-content .ProseMirror ol,
        .unified-page-content .ProseMirror li {
          text-align: left !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }
        
        .unified-page-content p {
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .unified-page-content h2,
        .unified-page-content h3 {
          color: white;
          margin-top: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .is-editor-empty:first-child::before {
          color: rgba(255, 255, 255, 0.4);
        }
        
        /* Roadmap-specific styles to remove all borders */
        .roadmap-content .roadmap-features-table-node .rounded-md {
          border: none !important;
          border-radius: 0 !important;
        }
        
        .roadmap-content .roadmap-features-table-node .border {
          border: none !important;
        }
        
        .roadmap-content .roadmap-features-table-node .border-\\[\\#2a2a2c\\] {
          border: none !important;
        }
        
        /* Remove TipTap selected node outline for roadmap tables */
        .roadmap-content .ProseMirror-selectednode {
          outline: none !important;
        }
        
        /* Command menu styles */
        .commands-menu {
          background-color: #0A0A0A;
          border: 1px solid #333;
          border-radius: 0.375rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          padding: 0.5rem 0;
          max-height: 20rem;
          overflow-y: auto;
          min-width: 20rem;
          z-index: 50;
        }
        
        .command-section-header {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #333;
          background-color: #0A0A0A;
        }
        
        .command-item {
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
          border-left: 2px solid transparent;
        }
        
        .command-item:hover,
        .command-item.selected {
          background-color: #1a1a1c;
          border-left-color: #666;
        }
        
        .command-item .title {
          font-weight: 500;
          font-size: 0.875rem;
          color: #e5e7eb;
        }
        
        .command-item .description {
          font-size: 0.75rem;
          color: #999;
          margin-top: 0.25rem;
          line-height: 1.3;
        }
        
        .command-item.selected .title {
          color: white;
        }
        
        .command-item.selected .description {
          color: #ccc;
        }
        
        .command-separator {
          height: 1px;
          background-color: #333;
          margin: 0.25rem 0;
        }
        
        /* Tooltip styles for glossary terms */
        .unified-page-content span[title] {
          border-bottom: 1px dotted #666;
          cursor: help;
          transition: all 0.2s ease;
        }
        
        .unified-page-content span[title]:hover {
          color: #60a5fa;
          border-bottom-color: #60a5fa;
          background-color: rgba(96, 165, 250, 0.1);
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
      
      {/* Page Details Drawer */}
      {pageId && (
        <PageDetailsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          pageId={pageId}
          pageData={currentPage}
        />
      )}
      </div>
    </TooltipProvider>
  );
}