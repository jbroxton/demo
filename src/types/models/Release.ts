/**
 * Release entity model
 */
export type Release = {
  id: string;
  name: string;
  description: string;
  releaseDate: string; // ISO date string
  priority: 'High' | 'Med' | 'Low';
  featureId: string;
  tenantId: string;
  isSaved: boolean;
  savedAt?: string | null;
};