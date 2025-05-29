// Block model following Notion's architecture
// Represents content units within pages

export type BlockType = 
  | 'document'        // Main TipTap content - hybrid approach
  | 'paragraph'
  | 'heading'
  | 'goal'
  | 'criteria'
  | 'attachment'
  | 'requirement'
  | 'table'
  | 'bulleted_list'
  | 'numbered_list';

export type ParentType = 'page' | 'block';

// Block content interfaces (type-specific)

// Document block - stores full TipTap JSON content (hybrid approach)
export interface DocumentContent {
  // TipTap JSON content structure
  tiptap_content: any; // The full TipTap document JSON
  // Metadata about the document
  word_count?: number;
  character_count?: number;
  last_saved_at?: string;
  version?: number;
}

export interface ParagraphContent {
  rich_text: Array<{
    type: 'text';
    text: {
      content: string;
      link?: string | null;
    };
  }>;
}

export interface HeadingContent {
  rich_text: Array<{
    type: 'text';
    text: {
      content: string;
      link?: string | null;
    };
  }>;
  level: 1 | 2 | 3;
}

export interface GoalContent {
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
  due_date?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface CriteriaContent {
  description: string;
  acceptance_test: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  reviewer?: string;
}

export interface AttachmentContent {
  url: string;
  title: string;
  file_type?: string;
  file_size?: number;
  description?: string;
}

export interface RequirementContent {
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  owner?: string;
  cuj?: string; // Critical User Journey
  status: 'Draft' | 'In Progress' | 'Complete' | 'Blocked';
  acceptance_criteria?: string[];
}

export interface TableContent {
  table_width: number;
  has_column_header: boolean;
  has_row_header: boolean;
  children: Array<{
    type: 'table_row';
    table_row: {
      cells: Array<Array<{
        type: 'text';
        text: {
          content: string;
        };
      }>>;
    };
  }>;
}

export interface ListContent {
  rich_text: Array<{
    type: 'text';
    text: {
      content: string;
      link?: string | null;
    };
  }>;
  children?: string[]; // IDs of child blocks
}

// Union type for all block content
export type BlockContent = 
  | DocumentContent
  | ParagraphContent
  | HeadingContent
  | GoalContent
  | CriteriaContent
  | AttachmentContent
  | RequirementContent
  | TableContent
  | ListContent;

// Base Block interface for JSONB storage within pages
export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  created_at: string;
  updated_at: string;
}

// Typed block variants
export interface DocumentBlock extends Block {
  type: 'document';
  content: DocumentContent;
}

export interface ParagraphBlock extends Block {
  type: 'paragraph';
  content: ParagraphContent;
}

export interface HeadingBlock extends Block {
  type: 'heading';
  content: HeadingContent;
}

export interface GoalBlock extends Block {
  type: 'goal';
  content: GoalContent;
}

export interface CriteriaBlock extends Block {
  type: 'criteria';
  content: CriteriaContent;
}

export interface AttachmentBlock extends Block {
  type: 'attachment';
  content: AttachmentContent;
}

export interface RequirementBlock extends Block {
  type: 'requirement';
  content: RequirementContent;
}

export interface TableBlock extends Block {
  type: 'table';
  content: TableContent;
}

export interface BulletedListBlock extends Block {
  type: 'bulleted_list';
  content: ListContent;
}

export interface NumberedListBlock extends Block {
  type: 'numbered_list';
  content: ListContent;
}

// Union type for type-safe blocks
export type TypedBlock = 
  | DocumentBlock
  | ParagraphBlock
  | HeadingBlock
  | GoalBlock
  | CriteriaBlock
  | AttachmentBlock
  | RequirementBlock
  | TableBlock
  | BulletedListBlock
  | NumberedListBlock;

// Block template content (for creating new blocks)
export const BLOCK_TEMPLATES: Record<BlockType, BlockContent> = {
  document: {
    tiptap_content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Start writing...'
            }
          ]
        }
      ]
    },
    word_count: 0,
    character_count: 0,
    version: 1
  },
  paragraph: {
    rich_text: [
      {
        type: 'text',
        text: {
          content: ''
        }
      }
    ]
  },
  heading: {
    rich_text: [
      {
        type: 'text',
        text: {
          content: 'Heading'
        }
      }
    ],
    level: 2
  },
  goal: {
    title: 'New Goal',
    description: '',
    status: 'not_started',
    priority: 'medium'
  },
  criteria: {
    description: '',
    acceptance_test: '',
    status: 'draft'
  },
  attachment: {
    url: '',
    title: 'New Attachment'
  },
  requirement: {
    name: 'New Requirement',
    priority: 'Medium',
    status: 'Draft'
  },
  table: {
    table_width: 3,
    has_column_header: true,
    has_row_header: false,
    children: [
      {
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: 'Header 1' } }],
            [{ type: 'text', text: { content: 'Header 2' } }],
            [{ type: 'text', text: { content: 'Header 3' } }]
          ]
        }
      },
      {
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: '' } }],
            [{ type: 'text', text: { content: '' } }],
            [{ type: 'text', text: { content: '' } }]
          ]
        }
      }
    ]
  },
  bulleted_list: {
    rich_text: [
      {
        type: 'text',
        text: {
          content: 'List item'
        }
      }
    ]
  },
  numbered_list: {
    rich_text: [
      {
        type: 'text',
        text: {
          content: 'List item'
        }
      }
    ]
  }
};

// Helper functions
export function getBlockTemplate(type: BlockType): BlockContent {
  return structuredClone(BLOCK_TEMPLATES[type]);
}

export function validateBlockContent(type: BlockType, content: any): boolean {
  // Basic validation - could be enhanced with more specific checks
  if (!content || typeof content !== 'object') {
    return false;
  }
  
  switch (type) {
    case 'document':
      return content.tiptap_content && 
             typeof content.tiptap_content === 'object' &&
             content.tiptap_content.type === 'doc';
    
    case 'paragraph':
    case 'heading':
    case 'bulleted_list':
    case 'numbered_list':
      return Array.isArray(content.rich_text);
    
    case 'goal':
      return typeof content.title === 'string' && 
             typeof content.description === 'string' &&
             ['not_started', 'in_progress', 'completed', 'blocked'].includes(content.status);
    
    case 'criteria':
      return typeof content.description === 'string' &&
             typeof content.acceptance_test === 'string' &&
             ['draft', 'review', 'approved', 'rejected'].includes(content.status);
    
    case 'attachment':
      return typeof content.url === 'string' && 
             typeof content.title === 'string';
    
    case 'requirement':
      return typeof content.name === 'string' &&
             ['High', 'Medium', 'Low'].includes(content.priority) &&
             ['Draft', 'In Progress', 'Complete', 'Blocked'].includes(content.status);
    
    case 'table':
      return typeof content.table_width === 'number' &&
             Array.isArray(content.children);
    
    default:
      return true;
  }
}

// Type guards
export function isDocumentBlock(block: Block): block is DocumentBlock {
  return block.type === 'document';
}

export function isParagraphBlock(block: Block): block is ParagraphBlock {
  return block.type === 'paragraph';
}

export function isHeadingBlock(block: Block): block is HeadingBlock {
  return block.type === 'heading';
}

export function isGoalBlock(block: Block): block is GoalBlock {
  return block.type === 'goal';
}

export function isCriteriaBlock(block: Block): block is CriteriaBlock {
  return block.type === 'criteria';
}

export function isAttachmentBlock(block: Block): block is AttachmentBlock {
  return block.type === 'attachment';
}

export function isRequirementBlock(block: Block): block is RequirementBlock {
  return block.type === 'requirement';
}

export function isTableBlock(block: Block): block is TableBlock {
  return block.type === 'table';
}

export function isListBlock(block: Block): block is BulletedListBlock | NumberedListBlock {
  return block.type === 'bulleted_list' || block.type === 'numbered_list';
}

// Utility function to reorder blocks by array index (since position is managed by array order)
export function reorderBlocks(blocks: Block[], fromIndex: number, toIndex: number): Block[] {
  const updatedBlocks = [...blocks];
  const [movedBlock] = updatedBlocks.splice(fromIndex, 1);
  updatedBlocks.splice(toIndex, 0, movedBlock);
  return updatedBlocks;
}