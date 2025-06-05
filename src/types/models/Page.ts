// Page model following Notion's architecture
// Replaces separate Product, Feature, Release, Roadmap models

import { Block } from './Block';

export type PageType = 'product' | 'project' | 'feature' | 'release' | 'roadmap' | 'feedback';

// Notion-style property value types
export interface PropertyValue {
  type: string;
  [key: string]: any; // Type-specific content
}

export interface SelectPropertyValue extends PropertyValue {
  type: 'select';
  select: {
    name: string;
    color: string;
  } | null;
}

export interface MultiSelectPropertyValue extends PropertyValue {
  type: 'multi_select';
  multi_select: Array<{
    name: string;
    color: string;
  }>;
}

export interface TextPropertyValue extends PropertyValue {
  type: 'text';
  rich_text: Array<{
    type: 'text';
    text: {
      content: string;
      link?: string | null;
    };
  }>;
}

export interface NumberPropertyValue extends PropertyValue {
  type: 'number';
  number: number | null;
}

export interface DatePropertyValue extends PropertyValue {
  type: 'date';
  date: {
    start: string;
    end?: string | null;
  } | null;
}

export interface PersonPropertyValue extends PropertyValue {
  type: 'person';
  people: Array<{
    id: string;
    name: string;
    email?: string;
  }>;
}

export interface RelationPropertyValue extends PropertyValue {
  type: 'relation';
  relation: Array<{
    id: string;
  }>;
}

export interface AssignmentPropertyValue extends PropertyValue {
  type: 'assignment';
  assignment: {
    roadmaps: Array<{
      id: string;
      title: string;
    }>;
    releases: Array<{
      id: string;
      title: string;
    }>;
  };
}

// Union type for all property values
export type AnyPropertyValue = 
  | SelectPropertyValue
  | MultiSelectPropertyValue
  | TextPropertyValue
  | NumberPropertyValue
  | DatePropertyValue
  | PersonPropertyValue
  | RelationPropertyValue
  | AssignmentPropertyValue;

// Note: Specific property interfaces commented out to resolve TypeScript compilation issues
// They can be re-enabled when needed with proper type handling


// Base Page interface following Notion's structure with JSON block storage
export interface Page {
  id: string;
  type: PageType;
  title: string;
  parent_id?: string | null;
  tenant_id: string;
  properties: Record<string, AnyPropertyValue>;
  blocks: Block[];
  block_count: number;
  last_block_update: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  last_edited_by?: string | null;
}

// Typed page variants
export interface ProjectPage extends Page {
  type: 'project';
}

export interface FeaturePage extends Page {
  type: 'feature';
}

export interface RoadmapPage extends Page {
  type: 'roadmap';
}

export interface ReleasePage extends Page {
  type: 'release';
}

export interface FeedbackPage extends Page {
  type: 'feedback';
}

// Union type for type-safe pages
export type TypedPage = ProjectPage | FeaturePage | RoadmapPage | ReleasePage | FeedbackPage;

// Property schema definitions (for validation)
export interface PropertySchema {
  id: string;
  name: string;
  type: PropertyValue['type'];
  config: PropertySchemaConfig;
}

export type PropertySchemaConfig = 
  | { type: 'select'; options: Array<{ name: string; color: string }> }
  | { type: 'multi_select'; options: Array<{ name: string; color: string }> }
  | { type: 'text' }
  | { type: 'number'; format?: 'number' | 'percent' | 'dollar' }
  | { type: 'date' }
  | { type: 'person' }
  | { type: 'relation'; target_page_type: PageType }
  | { type: 'assignment' };

// Property schemas for each page type
export const PAGE_TYPE_SCHEMAS: Record<PageType, PropertySchema[]> = {
  product: [
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'Planning', color: 'gray' },
          { name: 'Active', color: 'green' },
          { name: 'On Hold', color: 'yellow' },
          { name: 'Completed', color: 'blue' },
          { name: 'Cancelled', color: 'red' }
        ]
      }
    },
    {
      id: 'priority',
      name: 'Priority',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'green' }
        ]
      }
    },
    {
      id: 'assignedTo',
      name: 'Assigned To',
      type: 'assignment',
      config: { type: 'assignment' }
    }
  ],
  project: [
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'Planning', color: 'gray' },
          { name: 'Active', color: 'green' },
          { name: 'On Hold', color: 'yellow' },
          { name: 'Completed', color: 'blue' },
          { name: 'Cancelled', color: 'red' }
        ]
      }
    },
    {
      id: 'priority',
      name: 'Priority',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'green' }
        ]
      }
    },
    {
      id: 'owner',
      name: 'Owner',
      type: 'person',
      config: { type: 'person' }
    },
    {
      id: 'assignedTo',
      name: 'Assigned To',
      type: 'assignment',
      config: { type: 'assignment' }
    }
  ],
  feature: [
    {
      id: 'priority',
      name: 'Priority',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'green' }
        ]
      }
    },
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'Planning', color: 'gray' },
          { name: 'In Progress', color: 'blue' },
          { name: 'Complete', color: 'green' },
          { name: 'On Hold', color: 'yellow' }
        ]
      }
    },
    {
      id: 'roadmap',
      name: 'Roadmap',
      type: 'relation',
      config: { type: 'relation', target_page_type: 'roadmap' }
    },
    {
      id: 'release',
      name: 'Release',
      type: 'relation',
      config: { type: 'relation', target_page_type: 'release' }
    },
    {
      id: 'owner',
      name: 'Owner',
      type: 'person',
      config: { type: 'person' }
    },
    {
      id: 'assignedTo',
      name: 'Assigned To',
      type: 'assignment',
      config: { type: 'assignment' }
    }
  ],
  roadmap: [
    {
      id: 'quarter',
      name: 'Quarter',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'Q1', color: 'blue' },
          { name: 'Q2', color: 'green' },
          { name: 'Q3', color: 'yellow' },
          { name: 'Q4', color: 'red' }
        ]
      }
    },
    {
      id: 'progress',
      name: 'Progress',
      type: 'number',
      config: { type: 'number', format: 'percent' }
    },
    {
      id: 'owner',
      name: 'Owner',
      type: 'person',
      config: { type: 'person' }
    }
  ],
  release: [
    {
      id: 'release_date',
      name: 'Release Date',
      type: 'date',
      config: { type: 'date' }
    },
    {
      id: 'version',
      name: 'Version',
      type: 'text',
      config: { type: 'text' }
    },
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'Planned', color: 'gray' },
          { name: 'In Development', color: 'blue' },
          { name: 'Testing', color: 'yellow' },
          { name: 'Released', color: 'green' }
        ]
      }
    }
  ],
  feedback: [
    {
      id: 'status',
      name: 'Status',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'New', color: 'blue' },
          { name: 'In Review', color: 'yellow' },
          { name: 'Planned', color: 'green' },
          { name: 'Completed', color: 'purple' },
          { name: 'Declined', color: 'red' }
        ]
      }
    },
    {
      id: 'priority',
      name: 'Priority',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'green' }
        ]
      }
    },
    {
      id: 'feedbackType',
      name: 'Type',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'Bug', color: 'red' },
          { name: 'Feature Request', color: 'blue' },
          { name: 'Improvement', color: 'green' }
        ]
      }
    },
    {
      id: 'source',
      name: 'Source',
      type: 'select',
      config: {
        type: 'select',
        options: [
          { name: 'Manual', color: 'gray' }
        ]
      }
    },
    {
      id: 'customerName',
      name: 'Customer Name',
      type: 'text',
      config: { type: 'text' }
    },
    {
      id: 'customerEmail',
      name: 'Customer Email',
      type: 'text',
      config: { type: 'text' }
    },
    {
      id: 'assignedFeature',
      name: 'Assigned Feature',
      type: 'relation',
      config: { type: 'relation', target_page_type: 'feature' }
    }
  ]
};

// Helper functions
export function getPageTypeSchema(type: PageType): PropertySchema[] {
  return PAGE_TYPE_SCHEMAS[type] || [];
}

export function validatePageProperties(
  type: PageType,
  properties: Record<string, any>
): boolean {
  const schema = getPageTypeSchema(type);
  
  for (const [key, value] of Object.entries(properties)) {
    const propertySchema = schema.find(s => s.id === key);
    if (!propertySchema) {
      console.warn(`Unknown property ${key} for page type ${type}`);
      continue;
    }
    
    if (value && value.type !== propertySchema.type) {
      console.error(`Property ${key} has wrong type. Expected ${propertySchema.type}, got ${value.type}`);
      return false;
    }
  }
  
  return true;
}

// Type guards
export function isProjectPage(page: Page): page is ProjectPage {
  return page.type === 'project';
}

export function isFeaturePage(page: Page): page is FeaturePage {
  return page.type === 'feature';
}

export function isRoadmapPage(page: Page): page is RoadmapPage {
  return page.type === 'roadmap';
}

export function isReleasePage(page: Page): page is ReleasePage {
  return page.type === 'release';
}

export function isFeedbackPage(page: Page): page is FeedbackPage {
  return page.type === 'feedback';
}