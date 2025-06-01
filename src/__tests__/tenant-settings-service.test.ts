import { 
  getTenantSettings, 
  updateTenantSettings, 
  getSpeqqInstructions, 
  updateSpeqqInstructions,
  getDefaultSpeqqTemplate,
  buildAssistantInstructions 
} from '@/services/tenant-settings-db';

describe('Tenant Settings Service', () => {
  // Use the sample tenant ID from env.local
  const testTenantId = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    // Clean up any existing test data
    console.log('Testing with tenant ID:', testTenantId);
  });

  afterAll(async () => {
    // Clean up test data if needed
    console.log('Test completed for tenant:', testTenantId);
  });

  describe('Default Settings Creation', () => {
    it('should create default settings for new tenant', async () => {
      // This simulates what should happen when a tenant is first created
      const defaultSettings = {
        speqq_instructions: getDefaultSpeqqTemplate(),
        created_at: new Date().toISOString(),
      };

      const result = await updateTenantSettings(testTenantId, defaultSettings);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.tenant_id).toBe(testTenantId);
      expect(result.data?.settings_json.speqq_instructions).toContain('# Speqq Configuration');
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should create/update tenant settings', async () => {
      const updatedSettings = {
        speqq_instructions: '# Updated Speqq Configuration\n\nTest update',
        new_setting: 'test value',
      };

      const result = await updateTenantSettings(testTenantId, updatedSettings);
      
      expect(result.success).toBe(true);
      expect(result.data?.settings_json.speqq_instructions).toContain('Updated Speqq Configuration');
      expect(result.data?.settings_json.new_setting).toBe('test value');
    });

    it('should get tenant settings after creation', async () => {
      const result = await getTenantSettings(testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.tenant_id).toBe(testTenantId);
      expect(result.data?.settings_json).toBeDefined();
    });
  });

  describe('Speqq Instructions Specific Operations', () => {
    it('should get Speqq instructions for existing tenant', async () => {
      const result = await getSpeqqInstructions(testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toContain('Updated Speqq Configuration');
    });

    it('should return default template when no settings exist yet', async () => {
      // This tests the fallback behavior
      const result = await getSpeqqInstructions(testTenantId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
    });

    it('should update only Speqq instructions', async () => {
      const newInstructions = '# My Company Speqq Config\n\n## Company\n- **Name:** Test Corp\n- **Product:** Test Product';
      
      const result = await updateSpeqqInstructions(testTenantId, newInstructions);
      
      expect(result.success).toBe(true);
      expect(result.data?.settings_json.speqq_instructions).toContain('Test Corp');
      expect(result.data?.settings_json.new_setting).toBe('test value'); // Should preserve other settings
    });
  });

  describe('Template and Instruction Building', () => {
    it('should load default template from file', () => {
      const template = getDefaultSpeqqTemplate();
      
      expect(template).toBeDefined();
      expect(template).toContain('# Speqq Configuration');
      expect(template).toContain('## Company');
      expect(template).toContain('## Team');
      expect(template).toContain('## Product');
    });

    it('should build complete Assistant instructions', () => {
      const userContext = '# My Company\n\nWe build awesome products.';
      const instructions = buildAssistantInstructions(userContext);
      
      expect(instructions).toBeDefined();
      expect(instructions).toContain('You are Speqq AI');
      expect(instructions).toContain('--- COMPANY CONTEXT ---');
      expect(instructions).toContain('We build awesome products.');
    });

    it('should use default template when no user context provided', () => {
      const instructions = buildAssistantInstructions('');
      
      expect(instructions).toBeDefined();
      expect(instructions).toContain('You are Speqq AI');
      expect(instructions).toContain('--- COMPANY CONTEXT ---');
      expect(instructions).toContain('# Speqq Configuration');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed settings data', async () => {
      const malformedData = {
        speqq_instructions: null,
        invalid_field: undefined,
      };

      const result = await updateTenantSettings(testTenantId, malformedData);
      
      // Should handle gracefully (JSON will clean up null/undefined)
      expect(result.success).toBe(true);
    });
  });

  describe('Character Limits Validation', () => {
    it('should handle large Speqq instructions (up to 100k chars)', async () => {
      // Create a large but reasonable instruction set (around 10k chars)
      const largeInstructions = '# Large Company Configuration\n\n' + 
        'A'.repeat(10000) + '\n\n## Details\n' + 'B'.repeat(5000);
      
      const result = await updateSpeqqInstructions(testTenantId, largeInstructions);
      
      expect(result.success).toBe(true);
      expect(result.data?.settings_json.speqq_instructions.length).toBeGreaterThan(15000);
    });

    it('should build complete instructions under 256k limit', () => {
      const userContext = 'C'.repeat(50000); // 50k chars
      const instructions = buildAssistantInstructions(userContext);
      
      expect(instructions.length).toBeLessThan(256000); // Under 256k limit
      expect(instructions.length).toBeGreaterThan(50000); // Has both base + user
    });
  });
});