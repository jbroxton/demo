import { Requirement } from './Requirement';

/**
 * Feature entity model
 */
export type Feature = {
  id: string;
  name: string;
  priority: 'High' | 'Med' | 'Low';
  description: string;
  interfaceId: string;
  content?: string;
  releases?: string[];
  artifacts?: string[];
  requirements?: Requirement[];
  showRequirements?: boolean;

  // Roadmap related properties
  roadmapId?: string;
  workflowStatus?: string;
  releaseId?: string;
  releaseName?: string;
  tenantId?: string;
};