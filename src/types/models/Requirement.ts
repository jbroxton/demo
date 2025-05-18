/**
 * Requirement entity model
 */
export type Requirement = {
  id: string;
  name: string;
  owner?: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
  featureId: string;
  releaseId?: string;
  cuj?: string;
  acceptanceCriteria?: string;
  tenantId: string;
  isSaved: boolean;
  savedAt?: string | null;
};