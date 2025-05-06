import { initializeDefaultApprovalStages } from './approval-stages-db';
import { initializeDefaultApprovalStatuses } from './approval-statuses-db';

/**
 * Initialize the approval system with default stages and statuses
 */
export async function initializeApprovalSystem() {
  console.log('Initializing approval system...');
  
  try {
    // Run sequentially for better error isolation
    console.log('Initializing approval stages...');
    const stagesResult = await initializeDefaultApprovalStages();
    console.log('Stages initialization result:', stagesResult);
    
    console.log('Initializing approval statuses...');
    const statusesResult = await initializeDefaultApprovalStatuses();
    console.log('Statuses initialization result:', statusesResult);
    
    console.log('Approval system initialized successfully');
    return { success: true, stagesResult, statusesResult };
  } catch (error) {
    console.error('Error initializing approval system:', error);
    return { success: false, error: JSON.stringify(error) };
  }
}