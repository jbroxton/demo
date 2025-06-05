/**
 * Test the context sync to verify it's now using pages data
 */

import { exportTenantDataForOpenAI } from './src/services/ai-chat-fully-managed.ts';

async function testContextSync() {
  console.log('🔄 Testing Updated Context Export - Pages vs Legacy');
  console.log('='.repeat(60));
  
  try {
    const testTenantId = '22222222-2222-2222-2222-222222222222';
    
    console.log('📡 Exporting tenant data for OpenAI...');
    
    const contextData = await exportTenantDataForOpenAI(testTenantId);
    
    console.log('✅ Export completed');
    console.log('📊 Context data length:', contextData.length, 'characters');
    console.log('');
    
    // Show a preview of the context to verify it's using pages
    const preview = contextData.substring(0, 1000);
    console.log('📋 CONTEXT PREVIEW (first 1000 chars):');
    console.log('-'.repeat(50));
    console.log(preview);
    console.log('-'.repeat(50));
    console.log('');
    
    // Check for pages-specific features
    const featuresInContext = (contextData.match(/## Features \((\d+) total\)/)?.[1]);
    console.log('🎯 FEATURES COUNT IN CONTEXT:', featuresInContext);
    
    // Check if it mentions page properties and blocks
    const hasPagesStructure = contextData.includes('- **Properties**: {') && contextData.includes('- **Blocks**:');
    const hasLegacyStructure = contextData.includes('- **Interface ID**:') && contextData.includes('- **Saved**:');
    
    console.log('📊 CONTEXT ANALYSIS:');
    console.log('   ✓ Contains pages structure (Properties, Blocks):', hasPagesStructure);
    console.log('   ✗ Contains legacy structure (Interface ID, Saved):', hasLegacyStructure);
    console.log('');
    
    if (hasPagesStructure && !hasLegacyStructure) {
      console.log('🎉 SUCCESS: Context is now using pages structure!');
      console.log('   The AI will receive rich page data with properties and blocks');
      console.log('   Features count in context:', featuresInContext);
    } else if (hasLegacyStructure) {
      console.log('❌ ISSUE: Context still contains legacy structure');
      console.log('   This suggests the export function is still using old APIs');
    } else {
      console.log('🤔 UNCLEAR: Context structure is ambiguous');
    }
    
    // Count different page types mentioned
    const projectsCount = (contextData.match(/## Projects \((\d+) total\)/)?.[1]) || '0';
    const releasesCount = (contextData.match(/## Releases \((\d+) total\)/)?.[1]) || '0';
    const roadmapsCount = (contextData.match(/## Roadmaps \((\d+) total\)/)?.[1]) || '0';
    const feedbackCount = (contextData.match(/## Feedback \((\d+) total\)/)?.[1]) || '0';
    
    console.log('📈 PAGE TYPES IN CONTEXT:');
    console.log('   Projects:', projectsCount);
    console.log('   Features:', featuresInContext);
    console.log('   Releases:', releasesCount);
    console.log('   Roadmaps:', roadmapsCount);
    console.log('   Feedback:', feedbackCount);
    
    const totalPages = parseInt(projectsCount) + parseInt(featuresInContext || '0') + parseInt(releasesCount) + parseInt(roadmapsCount) + parseInt(feedbackCount);
    console.log('   TOTAL PAGES:', totalPages);
    
    if (totalPages > 100) {
      console.log('');
      console.log('🚀 VERIFICATION: AI will now see', totalPages, 'total pages!');
      console.log('   This is a massive improvement over legacy entities');
      console.log('   The AI has much richer context to work with');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testContextSync();