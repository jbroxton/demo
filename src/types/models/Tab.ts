/**
 * Tab entity model
 */
export interface Tab {
  id: string;
  title: string;
  type: 'feature' | 'product' | 'interface' | 'release' | 'roadmap' | 'document' | 'settings';
  itemId: string;
  hasChanges: boolean;  // UI state: are there unsaved edits?
  // isSaved and savedAt come from the entity itself
}