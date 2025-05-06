/**
 * Tab entity model
 */
export interface Tab {
  id: string;
  title: string;
  type: 'feature' | 'product' | 'interface' | 'release';
  itemId: string;
}