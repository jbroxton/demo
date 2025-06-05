import type { PageType } from '@/types/models/Page';

// Define allowed parent-child relationships
export const PARENTING_RULES: Record<PageType, PageType[]> = {
  product: ['product', 'project', 'feature'],
  project: ['project', 'feature'],
  feature: ['feature'],
  release: [], // Releases can't have children in hierarchy
  roadmap: [], // Roadmaps can't have children in hierarchy
  feedback: [], // Feedback can't have children in hierarchy
};

// Helper function to check if a page type can be a parent of another
export function canBeParentOf(parentType: PageType, childType: PageType): boolean {
  const allowedChildren = PARENTING_RULES[parentType];
  return allowedChildren.includes(childType);
}

// Get all allowed child types for a parent type
export function getAllowedChildTypes(parentType: PageType): PageType[] {
  return [...PARENTING_RULES[parentType]];
}

// Check if a page type can have children at all
export function canHaveChildren(pageType: PageType): boolean {
  return PARENTING_RULES[pageType].length > 0;
}

// Get all page types that can be top-level (no parent required)
export function getTopLevelPageTypes(): PageType[] {
  return ['product', 'project', 'feature', 'release', 'roadmap', 'feedback'];
}

// Validation function for parent-child relationship
export function validateParentChild(parentType: PageType | null, childType: PageType): {
  isValid: boolean;
  error?: string;
} {
  // If no parent, check if it's allowed to be top-level
  if (!parentType) {
    if (getTopLevelPageTypes().includes(childType)) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: `${childType} pages must have a parent`
    };
  }

  // Check if parent can have this child type
  if (canBeParentOf(parentType, childType)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `${parentType} pages cannot contain ${childType} pages`
  };
}