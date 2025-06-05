// Trigger sync by making a chat request
require('dotenv').config({ path: '.env.local' });

async function triggerSync() {
  try {
    console.log('🚀 Triggering sync via chat request...');
    
    // Make a simple chat request to trigger the sync
    const response = await fetch('http://localhost:3000/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': '22222222-2222-2222-2222-222222222222'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, can you help me?' }],
        tenantId: '22222222-2222-2222-2222-222222222222'
      })
    });
    
    if (response.ok) {
      console.log('✅ Chat request sent successfully');
      console.log('⏳ Sync should be happening in the background...');
      console.log('💡 Check the server logs for sync progress');
      console.log('🔍 Run debug-assistant.js again in 30 seconds to verify');
    } else {
      console.error(`❌ Chat request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Error triggering sync:', error);
  }
}

// Run the trigger
triggerSync();