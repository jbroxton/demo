/**
 * Product entity model
 */
export type Product = {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  interfaces?: string[];
  isSaved: boolean;
  savedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};