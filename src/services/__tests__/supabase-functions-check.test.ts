/**
 * Check if required Supabase functions exist
 */

import { describe, test, expect } from '@jest/globals';
import { supabase } from '@/services/supabase';

describe('Supabase Functions Check', () => {
  test('should verify match_documents function exists', async () => {
    console.log('🔍 Checking Supabase database functions...');
    
    try {
      // Check if match_documents function exists by trying to call it
      console.log('📝 Testing match_documents function...');
      
      const testEmbedding = new Array(1536).fill(0.1); // Create a simple test embedding
      
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: testEmbedding,
        match_threshold: 0.1,
        match_count: 1,
        tenant_filter: 'test-tenant'
      });
      
      if (error) {
        console.error('❌ match_documents function error:', error);
        console.log('💡 This function needs to be created in Supabase');
        expect(error).toBeNull();
      } else {
        console.log('✅ match_documents function exists and working');
        console.log(`📊 Returned ${data?.length || 0} results`);
        expect(data).toBeDefined();
      }
      
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      throw error;
    }
  });

  test('should verify ai_embeddings table is accessible', async () => {
    console.log('🔍 Checking ai_embeddings table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('ai_embeddings')
      .select('*')
      .limit(0);
      
    if (tableError) {
      console.error('❌ ai_embeddings table error:', tableError);
      expect(tableError).toBeNull();
    } else {
      console.log('✅ ai_embeddings table accessible');
      expect(tableInfo).toBeDefined();
    }
  });

  test('should check current embeddings count', async () => {
    console.log('🔍 Checking current embeddings...');
    
    const { data, error, count } = await supabase
      .from('ai_embeddings')
      .select('*', { count: 'exact' })
      .limit(5);
      
    if (error) {
      console.error('❌ Error querying ai_embeddings:', error);
      expect(error).toBeNull();
    } else {
      console.log(`📊 Total embeddings found: ${count || 0}`);
      
      if (data && data.length > 0) {
        console.log('📋 Sample embeddings:');
        data.forEach((item, idx) => {
          console.log(`  ${idx + 1}. ID: ${item.id}`);
          console.log(`     Type: ${item.entity_type}`);
          console.log(`     Entity ID: ${item.entity_id}`);
          console.log(`     Tenant: ${item.tenant_id}`);
        });
      } else {
        console.log('📭 No embeddings found in the database');
      }
      
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});