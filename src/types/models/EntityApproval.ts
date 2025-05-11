/**
 * EntityApproval entity model
 */
export type EntityApproval = {
  id: string;
  entity_id: string;
  entity_type: 'feature' | 'release';
  stage_id: string;
  status_id: string;
  approver?: string;
  comments?: string;
  roadmap_status?: string;
  updated_at: string;
  created_at: string;
};