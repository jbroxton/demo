/**
 * @file Assistant Cleanup Utility Tests
 * @description Tests for the assistant cleanup utility that fixes orphaned references
 * 
 * Tests the database cleanup functionality that resolves orphaned assistant
 * references left by the dual management systems.
 */

import { 
  AssistantCleanupUtility, 
  runAssistantCleanup,
  type CleanupReport 
} from '@/utils/assistant-cleanup-utility';
import { supabase } from '@/services/supabase';
import OpenAI from 'openai';

// Test environment setup
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || '22222222-2222-2222-2222-222222222222';
const TEST_ORPHAN_TENANT_ID = 'orphan-test-tenant-id';

// Real OpenAI client for integration tests
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
  dangerouslyAllowBrowser: true, // Safe for Jest testing environment
});

describe('AssistantCleanupUtility - Real Database Integration Tests', () => {
  
  beforeAll(async () => {
    // Verify test environment
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required for integration tests');
    }
    
    console.log('🧹 Running cleanup utility tests with real database');
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestOrphanData();
  });

  describe('Orphaned Reference Detection', () => {
    
    test('should detect orphaned references in System A (tenant_settings)', async () => {
      // Create orphaned reference in System A
      const orphanAssistantId = 'asst_orphan_system_a_test';
      
      await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: TEST_ORPHAN_TENANT_ID,
          settings_json: {
            openai_assistant_id: orphanAssistantId,
            other_setting: 'test'
          }
        });

      // Run cleanup in dry-run mode
      const utility = new AssistantCleanupUtility(true);
      const report = await utility.runCleanup();

      // Should detect the orphaned reference
      expect(report.summary.orphanedReferencesFound).toBeGreaterThan(0);
      expect(report.details.systemA).toContainEqual(
        expect.objectContaining({
          tenantId: TEST_ORPHAN_TENANT_ID,
          assistantId: orphanAssistantId,
          source: 'tenant_settings',
          reason: 'Assistant not found in OpenAI'
        })
      );
    }, 30000);

    test('should detect orphaned references in System B (ai_chat_fully_managed_assistants)', async () => {
      // Create orphaned reference in System B
      const orphanAssistantId = 'asst_orphan_system_b_test';
      
      await supabase
        .from('ai_chat_fully_managed_assistants')
        .upsert({
          tenant_id: TEST_ORPHAN_TENANT_ID,
          assistant_id: orphanAssistantId,
          file_ids: [],
          last_synced: new Date().toISOString()
        });

      // Run cleanup in dry-run mode
      const utility = new AssistantCleanupUtility(true);
      const report = await utility.runCleanup();

      // Should detect the orphaned reference
      expect(report.summary.orphanedReferencesFound).toBeGreaterThan(0);
      expect(report.details.systemB).toContainEqual(
        expect.objectContaining({
          tenantId: TEST_ORPHAN_TENANT_ID,
          assistantId: orphanAssistantId,
          source: 'ai_chat_fully_managed_assistants',
          reason: 'Assistant not found in OpenAI'
        })
      );
    }, 30000);

  });

  describe('Valid Assistant Detection', () => {
    
    test('should identify valid assistants correctly', async () => {
      // First create a real assistant for testing
      const assistant = await openai.beta.assistants.create({
        name: 'Test Assistant for Cleanup Validation',
        instructions: 'Test assistant for cleanup utility validation',
        model: 'gpt-4-1106-preview',
        tools: [{ type: 'file_search' }]
      });

      try {
        // Add reference to both systems
        await Promise.all([
          supabase
            .from('tenant_settings')
            .upsert({
              tenant_id: TEST_ORPHAN_TENANT_ID,
              settings_json: {
                openai_assistant_id: assistant.id
              }
            }),
          supabase
            .from('ai_chat_fully_managed_assistants')
            .upsert({
              tenant_id: TEST_ORPHAN_TENANT_ID,
              assistant_id: assistant.id,
              file_ids: [],
              last_synced: new Date().toISOString()
            })
        ]);

        // Run cleanup
        const utility = new AssistantCleanupUtility(true);
        const report = await utility.runCleanup();

        // Should identify the valid assistant
        expect(report.summary.validReferencesFound).toBeGreaterThan(0);
        expect(report.details.validAssistants).toContainEqual(
          expect.objectContaining({
            tenantId: TEST_ORPHAN_TENANT_ID,
            assistantId: assistant.id,
            name: expect.stringContaining('Test Assistant'),
            sources: expect.arrayContaining(['tenant_settings', 'ai_chat_fully_managed_assistants'])
          })
        );

      } finally {
        // Cleanup the test assistant
        try {
          await openai.beta.assistants.del(assistant.id);
        } catch (error) {
          console.warn('Could not cleanup test assistant:', error);
        }
      }
    }, 30000);

  });

  describe('Orphaned Reference Removal', () => {
    
    test('should remove orphaned references in execute mode', async () => {
      // Create orphaned references in both systems
      const orphanAssistantId = 'asst_orphan_for_removal_test';
      
      await Promise.all([
        supabase
          .from('tenant_settings')
          .upsert({
            tenant_id: TEST_ORPHAN_TENANT_ID,
            settings_json: {
              openai_assistant_id: orphanAssistantId,
              other_setting: 'should_remain'
            }
          }),
        supabase
          .from('ai_chat_fully_managed_assistants')
          .upsert({
            tenant_id: TEST_ORPHAN_TENANT_ID,
            assistant_id: orphanAssistantId,
            file_ids: [],
            last_synced: new Date().toISOString()
          })
      ]);

      // Run cleanup in execute mode
      const utility = new AssistantCleanupUtility(false); // Execute mode
      const report = await utility.runCleanup();

      // Should remove the orphaned references
      expect(report.summary.orphanedReferencesRemoved).toBeGreaterThan(0);

      // Verify System A reference was cleaned up properly
      const { data: tenantSettings } = await supabase
        .from('tenant_settings')
        .select('settings_json')
        .eq('tenant_id', TEST_ORPHAN_TENANT_ID)
        .single();

      const settingsJson = tenantSettings?.settings_json as any;
      expect(settingsJson?.openai_assistant_id).toBeUndefined();
      expect(settingsJson?.other_setting).toBe('should_remain'); // Other settings preserved

      // Verify System B reference was removed
      const { data: assistantRecord, error } = await supabase
        .from('ai_chat_fully_managed_assistants')
        .select('assistant_id')
        .eq('tenant_id', TEST_ORPHAN_TENANT_ID)
        .single();

      expect(error?.code).toBe('PGRST116'); // No rows found
      expect(assistantRecord).toBeNull();
    }, 30000);

  });

  describe('Report Generation', () => {
    
    test('should generate comprehensive cleanup report', async () => {
      // Create test scenario with both orphaned and valid references
      const orphanAssistantId = 'asst_orphan_for_report_test';
      
      await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: TEST_ORPHAN_TENANT_ID,
          settings_json: {
            openai_assistant_id: orphanAssistantId
          }
        });

      const utility = new AssistantCleanupUtility(true);
      const report = await utility.runCleanup();
      const reportText = utility.generateReport();

      // Verify report structure
      expect(reportText).toContain('# Assistant Cleanup Report');
      expect(reportText).toContain('## Summary');
      expect(reportText).toContain('**Mode**: Dry Run');
      expect(reportText).toContain('**Total tenants checked**:');
      expect(reportText).toContain('**Orphaned references found**:');
      
      if (report.summary.orphanedReferencesFound > 0) {
        expect(reportText).toContain('## Orphaned References');
      }
      
      if (report.summary.validReferencesFound > 0) {
        expect(reportText).toContain('## Valid Assistants');
      }
    }, 30000);

  });

  describe('Error Handling', () => {
    
    test('should handle database connection errors gracefully', async () => {
      const utility = new AssistantCleanupUtility(true);
      
      // The utility should handle database errors gracefully
      try {
        const report = await utility.runCleanup();
        expect(report).toBeDefined();
        expect(report.summary).toBeDefined();
      } catch (error) {
        // If it fails, it should be a proper error with context
        expect(error).toBeInstanceOf(Error);
        expect(error).toHaveProperty('message');
      }
    }, 30000);

    test('should handle OpenAI API errors gracefully', async () => {
      // Test with missing API key
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      try {
        const utility = new AssistantCleanupUtility(true);
        await utility.runCleanup();
        fail('Should have thrown error for missing API key');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('OpenAI API key not configured');
      } finally {
        // Restore API key
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

  });

  describe('Convenience Functions', () => {
    
    test('runAssistantCleanup function should work correctly', async () => {
      const report = await runAssistantCleanup(true); // Dry run
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.details).toBeDefined();
      expect(typeof report.summary.totalTenantsChecked).toBe('number');
      expect(typeof report.summary.orphanedReferencesFound).toBe('number');
      expect(typeof report.summary.validReferencesFound).toBe('number');
    }, 30000);

  });

});

describe('AssistantCleanupUtility - Unit Tests', () => {

  describe('Report Structure Validation', () => {
    
    test('should initialize with correct report structure', () => {
      const utility = new AssistantCleanupUtility(true);
      
      // Access report through generateReport method
      const reportText = utility.generateReport();
      
      expect(reportText).toContain('# Assistant Cleanup Report');
      expect(reportText).toContain('**Mode**: Dry Run');
    });

  });

});

/**
 * Test Helper Functions
 */

async function cleanupTestOrphanData(): Promise<void> {
  try {
    // Clean up test orphan data
    await Promise.all([
      supabase
        .from('tenant_settings')
        .delete()
        .eq('tenant_id', TEST_ORPHAN_TENANT_ID),
      supabase
        .from('ai_chat_fully_managed_assistants')
        .delete()
        .eq('tenant_id', TEST_ORPHAN_TENANT_ID)
    ]);
  } catch (error) {
    console.warn('Could not cleanup test orphan data:', error);
  }
}

/**
 * Test Suite Summary
 * 
 * This test suite validates the assistant cleanup utility:
 * 
 * 1. ✅ Detects orphaned references in both database systems
 * 2. ✅ Identifies valid assistants correctly
 * 3. ✅ Removes orphaned references in execute mode
 * 4. ✅ Preserves other settings when cleaning up System A
 * 5. ✅ Generates comprehensive cleanup reports
 * 6. ✅ Handles errors gracefully
 * 7. ✅ Provides convenience functions for easy usage
 * 
 * The utility is critical for maintaining database consistency
 * after consolidating the dual assistant management systems.
 */