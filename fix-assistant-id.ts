/**
 * Manually set the correct assistant ID in the database
 */

import { updateTenantSettings, getTenantSettings } from './src/services/tenant-settings-db';

async function fixAssistantId() {
  const tenantId = '22222222-2222-2222-2222-222222222222';
  const correctAssistantId = 'asst_KicskzxGuLgWVut9ShdHh8Za';
  
  console.log('🔧 Fixing assistant ID in database...');
  
  try {
    // Get current settings
    const settingsResult = await getTenantSettings(tenantId);
    const existingSettings = settingsResult.data?.settings_json || {};
    
    console.log('Current assistant ID:', existingSettings.openai_assistant_id);
    
    // Update with correct assistant ID
    const updateResult = await updateTenantSettings(tenantId, {
      ...existingSettings,
      openai_assistant_id: correctAssistantId,
    });
    
    if (updateResult.success) {
      console.log('✅ Successfully updated assistant ID to:', correctAssistantId);
      console.log('Database now points to your existing assistant');
    } else {
      console.log('❌ Failed to update:', updateResult.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAssistantId().catch(console.error);