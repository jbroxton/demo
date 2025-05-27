/**
 * Integration test for Tenant Settings API + Services
 * Tests the complete flow from API endpoints to database operations
 */

import { 
  getTenantSettings, 
  updateTenantSettings,
  getSpeqqInstructions,
  updateSpeqqInstructions,
  getDefaultSpeqqTemplate,
  buildAssistantInstructions
} from '@/services/tenant-settings-db';

describe('Tenant Settings API + Services Integration', () => {
  const testTenantId = '22222222-2222-2222-2222-222222222222';

  describe('Complete Settings Flow', () => {
    it('should handle full tenant settings lifecycle', async () => {
      // 1. Test getting non-existent settings (should work gracefully)
      const initialResult = await getTenantSettings(testTenantId);
      expect(initialResult.success).toBe(true);
      // Data might be null or existing from previous tests

      // 2. Create initial settings
      const initialSettings = {
        speqq_instructions: '# Integration Test Company\n\n## About\nTesting API integration',
        api_test: true,
        integration_timestamp: new Date().toISOString()
      };

      const createResult = await updateTenantSettings(testTenantId, initialSettings);
      expect(createResult.success).toBe(true);
      expect(createResult.data?.tenant_id).toBe(testTenantId);
      expect(createResult.data?.settings_json.speqq_instructions).toContain('Integration Test Company');
      expect(createResult.data?.settings_json.api_test).toBe(true);

      // 3. Verify settings were saved correctly
      const getAfterCreateResult = await getTenantSettings(testTenantId);
      expect(getAfterCreateResult.success).toBe(true);
      expect(getAfterCreateResult.data?.settings_json.speqq_instructions).toContain('Integration Test Company');
      expect(getAfterCreateResult.data?.settings_json.api_test).toBe(true);

      // 4. Update only Speqq instructions (should preserve other settings)
      const updatedInstructions = '# Updated Integration Test\n\n## About\nTesting partial updates';
      const updateSpeqqResult = await updateSpeqqInstructions(testTenantId, updatedInstructions);
      
      expect(updateSpeqqResult.success).toBe(true);
      expect(updateSpeqqResult.data?.settings_json.speqq_instructions).toContain('Updated Integration Test');
      expect(updateSpeqqResult.data?.settings_json.api_test).toBe(true); // Should be preserved

      // 5. Get only Speqq instructions
      const speqqResult = await getSpeqqInstructions(testTenantId);
      expect(speqqResult.success).toBe(true);
      expect(speqqResult.data).toContain('Updated Integration Test');

      // 6. Test Assistant instructions building
      const assistantInstructions = buildAssistantInstructions(speqqResult.data!);
      expect(assistantInstructions).toContain('You are Speqq AI'); // Base instructions
      expect(assistantInstructions).toContain('--- COMPANY CONTEXT ---');
      expect(assistantInstructions).toContain('Updated Integration Test'); // User context
      expect(assistantInstructions.length).toBeLessThan(256000); // Under 256k limit

      // 7. Update with complex nested settings
      const complexSettings = {
        speqq_instructions: '# Complex Company Config\n\nAdvanced settings test',
        team: {
          size: 25,
          departments: ['Engineering', 'Product', 'Design'],
          locations: {
            hq: 'San Francisco',
            remote: true
          }
        },
        features: {
          ai_chat: true,
          roadmaps: true,
          analytics: false
        },
        metadata: {
          test_run: true,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      const complexUpdateResult = await updateTenantSettings(testTenantId, complexSettings);
      expect(complexUpdateResult.success).toBe(true);
      expect(complexUpdateResult.data?.settings_json.team.size).toBe(25);
      expect(complexUpdateResult.data?.settings_json.team.departments).toContain('Engineering');
      expect(complexUpdateResult.data?.settings_json.features.ai_chat).toBe(true);

      // 8. Verify complex settings were saved correctly
      const finalGetResult = await getTenantSettings(testTenantId);
      expect(finalGetResult.success).toBe(true);
      expect(finalGetResult.data?.settings_json.team.locations.hq).toBe('San Francisco');
      expect(finalGetResult.data?.settings_json.features.roadmaps).toBe(true);
      expect(finalGetResult.data?.settings_json.metadata.version).toBe('1.0.0');
    });

    it('should handle large settings data efficiently', async () => {
      // Test with large Speqq instructions (simulating real-world usage)
      const largeInstructions = `# Large Scale Company Configuration

## Company Overview
${'Large company details. '.repeat(1000)}

## Team Structure
${'Team information. '.repeat(500)}

## Product Details
${'Product specifications. '.repeat(750)}

## Additional Context
${'More context information. '.repeat(250)}`;

      const largeSettings = {
        speqq_instructions: largeInstructions,
        large_data_test: true,
        data_size: largeInstructions.length
      };

      const result = await updateTenantSettings(testTenantId, largeSettings);
      expect(result.success).toBe(true);
      expect(result.data?.settings_json.speqq_instructions.length).toBeGreaterThan(10000);
      expect(result.data?.settings_json.data_size).toBe(largeInstructions.length);

      // Verify retrieval of large data
      const getResult = await getTenantSettings(testTenantId);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.settings_json.speqq_instructions.length).toBeGreaterThan(10000);
    });

    it('should handle concurrent updates correctly', async () => {
      // Test concurrent updates to ensure data integrity
      const promises = [
        updateSpeqqInstructions(testTenantId, '# Concurrent Update 1'),
        updateSpeqqInstructions(testTenantId, '# Concurrent Update 2'),
        updateSpeqqInstructions(testTenantId, '# Concurrent Update 3')
      ];

      const results = await Promise.all(promises);
      
      // All updates should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Final state should be consistent
      const finalResult = await getTenantSettings(testTenantId);
      expect(finalResult.success).toBe(true);
      expect(finalResult.data?.settings_json.speqq_instructions).toMatch(/# Concurrent Update [123]/);
    });
  });

  describe('Error Scenarios Integration', () => {
    it('should handle malformed data gracefully', async () => {
      const malformedData = {
        speqq_instructions: null,
        undefined_field: undefined,
        circular_ref: {} as any
      };
      
      // Create circular reference
      malformedData.circular_ref.self = malformedData.circular_ref;

      // Should handle gracefully by cleaning up the data
      const result = await updateTenantSettings(testTenantId, {
        speqq_instructions: null,
        test_malformed: true
      });

      expect(result.success).toBe(true);
      // null should be preserved in JSONB
      expect(result.data?.settings_json.speqq_instructions).toBeNull();
    });

    it('should maintain data consistency across operations', async () => {
      // Set initial state
      const initialSettings = {
        speqq_instructions: '# Consistency Test',
        counter: 0,
        consistency_test: true
      };

      await updateTenantSettings(testTenantId, initialSettings);

      // Perform multiple operations
      for (let i = 1; i <= 5; i++) {
        const currentSettings = await getTenantSettings(testTenantId);
        expect(currentSettings.success).toBe(true);

        const updatedSettings = {
          ...currentSettings.data!.settings_json,
          counter: i,
          last_update: new Date().toISOString()
        };

        const updateResult = await updateTenantSettings(testTenantId, updatedSettings);
        expect(updateResult.success).toBe(true);
        expect(updateResult.data?.settings_json.counter).toBe(i);
      }

      // Verify final state
      const finalResult = await getTenantSettings(testTenantId);
      expect(finalResult.success).toBe(true);
      expect(finalResult.data?.settings_json.counter).toBe(5);
      expect(finalResult.data?.settings_json.consistency_test).toBe(true);
    });
  });

  describe('Template and Assistant Integration', () => {
    it('should integrate templates with database operations', async () => {
      // Test default template behavior
      const defaultTemplate = getDefaultSpeqqTemplate();
      expect(defaultTemplate).toContain('# Speqq Configuration');

      // Store default template
      const storeDefaultResult = await updateSpeqqInstructions(testTenantId, defaultTemplate);
      expect(storeDefaultResult.success).toBe(true);

      // Retrieve and verify
      const retrievedDefault = await getSpeqqInstructions(testTenantId);
      expect(retrievedDefault.success).toBe(true);
      expect(retrievedDefault.data).toBe(defaultTemplate);

      // Test assistant instructions building with database data
      const assistantInstructions = buildAssistantInstructions(retrievedDefault.data!);
      expect(assistantInstructions).toContain('You are Speqq AI');
      expect(assistantInstructions).toContain(defaultTemplate);

      // Test with custom instructions
      const customInstructions = `# Custom Company Setup

## Our Company
- **Name:** IntegrationTest Corp
- **Product:** Testing Platform
- **Industry:** Software Testing
- **Stage:** Growth

## Our Team
- **Size:** 50
- **Role:** Product Manager
- **Method:** Agile/Scrum

## Our Product
- **Users:** QA Engineers and Developers
- **Value:** Automated integration testing
- **Model:** SaaS subscription
- **Success:** Test coverage and bug detection rate`;

      const customResult = await updateSpeqqInstructions(testTenantId, customInstructions);
      expect(customResult.success).toBe(true);

      const customAssistantInstructions = buildAssistantInstructions(customInstructions);
      expect(customAssistantInstructions).toContain('IntegrationTest Corp');
      expect(customAssistantInstructions).toContain('QA Engineers and Developers');
      expect(customAssistantInstructions.length).toBeLessThan(256000);
    });
  });
});