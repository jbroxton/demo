/**
 * ApprovalStage entity model
 */
export type ApprovalStage = {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'main' | 'launch';
  created_at: string;
  updated_at: string;
};