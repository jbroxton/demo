/**
 * @file Assistant Cleanup Utility
 * @description Utility to clean up orphaned assistant references in both database systems
 * 
 * This utility addresses the critical issue of orphaned assistant references that occur when:
 * 1. Assistants are deleted from OpenAI but references remain in the database
 * 2. The dual assistant management systems create inconsistent state
 * 3. Failed assistant creation leaves partial database entries
 */

import OpenAI from 'openai';
import { supabase } from '@/services/supabase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
  dangerouslyAllowBrowser: true, // Safe for Jest testing environment
});

export interface CleanupReport {
  summary: {
    totalTenantsChecked: number;
    orphanedReferencesFound: number;
    orphanedReferencesRemoved: number;
    validReferencesFound: number;
    errors: string[];
  };
  details: {
    systemA: OrphanedReference[];
    systemB: OrphanedReference[];
    validAssistants: ValidAssistant[];
  };
}

export interface OrphanedReference {
  tenantId: string;
  assistantId: string;
  source: 'tenant_settings' | 'ai_chat_fully_managed_assistants';
  reason: string;
}

export interface ValidAssistant {
  tenantId: string;
  assistantId: string;
  name: string;
  sources: ('tenant_settings' | 'ai_chat_fully_managed_assistants')[];
}

/**
 * Assistant Cleanup Utility
 * Provides comprehensive cleanup of orphaned assistant references
 */
export class AssistantCleanupUtility {
  private dryRun: boolean;
  private report: CleanupReport;

  constructor(dryRun: boolean = true) {
    this.dryRun = dryRun;
    this.report = {
      summary: {
        totalTenantsChecked: 0,
        orphanedReferencesFound: 0,
        orphanedReferencesRemoved: 0,
        validReferencesFound: 0,
        errors: []
      },
      details: {
        systemA: [],
        systemB: [],
        validAssistants: []
      }
    };
  }

  /**
   * Run comprehensive cleanup of orphaned assistant references
   */
  async runCleanup(): Promise<CleanupReport> {
    try {
      console.log(`[AssistantCleanup] Starting cleanup (dry-run: ${this.dryRun})`);
      
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Get all assistant references from both systems
      const [systemAReferences, systemBReferences] = await Promise.all([
        this.getSystemAReferences(),
        this.getSystemBReferences()
      ]);

      console.log(`[AssistantCleanup] Found ${systemAReferences.length} references in System A (tenant_settings)`);
      console.log(`[AssistantCleanup] Found ${systemBReferences.length} references in System B (ai_chat_fully_managed_assistants)`);

      // Combine all unique tenant IDs
      const allTenantIds = new Set([
        ...systemAReferences.map(ref => ref.tenantId),
        ...systemBReferences.map(ref => ref.tenantId)
      ]);

      this.report.summary.totalTenantsChecked = allTenantIds.size;

      // Check each tenant's assistant references
      for (const tenantId of allTenantIds) {
        await this.checkTenantAssistants(tenantId, systemAReferences, systemBReferences);
      }

      // Generate summary
      this.report.summary.orphanedReferencesFound = 
        this.report.details.systemA.length + this.report.details.systemB.length;

      console.log(`[AssistantCleanup] Cleanup complete`);
      console.log(`[AssistantCleanup] Total tenants checked: ${this.report.summary.totalTenantsChecked}`);
      console.log(`[AssistantCleanup] Orphaned references found: ${this.report.summary.orphanedReferencesFound}`);
      console.log(`[AssistantCleanup] Valid assistants found: ${this.report.summary.validReferencesFound}`);

      if (!this.dryRun) {
        console.log(`[AssistantCleanup] Orphaned references removed: ${this.report.summary.orphanedReferencesRemoved}`);
      }

      return this.report;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.report.summary.errors.push(errorMessage);
      console.error('[AssistantCleanup] Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Get assistant references from System A (tenant_settings)
   */
  private async getSystemAReferences(): Promise<Array<{tenantId: string, assistantId: string}>> {
    try {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('tenant_id, settings_json');

      if (error) {
        throw new Error(`Failed to fetch tenant_settings: ${error.message}`);
      }

      const references: Array<{tenantId: string, assistantId: string}> = [];

      for (const row of data || []) {
        const settingsJson = row.settings_json as any;
        if (settingsJson?.openai_assistant_id) {
          references.push({
            tenantId: row.tenant_id,
            assistantId: settingsJson.openai_assistant_id
          });
        }
      }

      return references;
    } catch (error) {
      console.error('[AssistantCleanup] Error fetching System A references:', error);
      throw error;
    }
  }

  /**
   * Get assistant references from System B (ai_chat_fully_managed_assistants)
   */
  private async getSystemBReferences(): Promise<Array<{tenantId: string, assistantId: string}>> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_fully_managed_assistants')
        .select('tenant_id, assistant_id');

      if (error) {
        throw new Error(`Failed to fetch ai_chat_fully_managed_assistants: ${error.message}`);
      }

      return data?.map(row => ({
        tenantId: row.tenant_id,
        assistantId: row.assistant_id
      })) || [];

    } catch (error) {
      console.error('[AssistantCleanup] Error fetching System B references:', error);
      throw error;
    }
  }

  /**
   * Check all assistant references for a specific tenant
   */
  private async checkTenantAssistants(
    tenantId: string,
    systemAReferences: Array<{tenantId: string, assistantId: string}>,
    systemBReferences: Array<{tenantId: string, assistantId: string}>
  ): Promise<void> {
    try {
      const tenantSystemA = systemAReferences.filter(ref => ref.tenantId === tenantId);
      const tenantSystemB = systemBReferences.filter(ref => ref.tenantId === tenantId);

      // Check System A references
      for (const ref of tenantSystemA) {
        const isValid = await this.validateAssistantExists(ref.assistantId);
        
        if (isValid) {
          const assistant = await this.getAssistantInfo(ref.assistantId);
          this.addValidAssistant(tenantId, ref.assistantId, assistant?.name || 'Unknown', 'tenant_settings');
        } else {
          this.addOrphanedReference(tenantId, ref.assistantId, 'tenant_settings', 'Assistant not found in OpenAI');
          
          if (!this.dryRun) {
            await this.removeSystemAReference(tenantId, ref.assistantId);
            this.report.summary.orphanedReferencesRemoved++;
          }
        }
      }

      // Check System B references
      for (const ref of tenantSystemB) {
        const isValid = await this.validateAssistantExists(ref.assistantId);
        
        if (isValid) {
          const assistant = await this.getAssistantInfo(ref.assistantId);
          this.addValidAssistant(tenantId, ref.assistantId, assistant?.name || 'Unknown', 'ai_chat_fully_managed_assistants');
        } else {
          this.addOrphanedReference(tenantId, ref.assistantId, 'ai_chat_fully_managed_assistants', 'Assistant not found in OpenAI');
          
          if (!this.dryRun) {
            await this.removeSystemBReference(tenantId, ref.assistantId);
            this.report.summary.orphanedReferencesRemoved++;
          }
        }
      }

    } catch (error) {
      const errorMessage = `Error checking tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.report.summary.errors.push(errorMessage);
      console.error('[AssistantCleanup]', errorMessage);
    }
  }

  /**
   * Validate that an assistant exists in OpenAI
   */
  private async validateAssistantExists(assistantId: string): Promise<boolean> {
    try {
      await openai.beta.assistants.retrieve(assistantId);
      return true;
    } catch (error) {
      // Assistant not found
      return false;
    }
  }

  /**
   * Get assistant information from OpenAI
   */
  private async getAssistantInfo(assistantId: string): Promise<{name: string, id: string} | null> {
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      return {
        id: assistant.id,
        name: assistant.name || 'Unnamed Assistant'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Add orphaned reference to report
   */
  private addOrphanedReference(
    tenantId: string, 
    assistantId: string, 
    source: 'tenant_settings' | 'ai_chat_fully_managed_assistants',
    reason: string
  ): void {
    const orphanedRef: OrphanedReference = {
      tenantId,
      assistantId,
      source,
      reason
    };

    if (source === 'tenant_settings') {
      this.report.details.systemA.push(orphanedRef);
    } else {
      this.report.details.systemB.push(orphanedRef);
    }
  }

  /**
   * Add valid assistant to report
   */
  private addValidAssistant(
    tenantId: string, 
    assistantId: string, 
    name: string, 
    source: 'tenant_settings' | 'ai_chat_fully_managed_assistants'
  ): void {
    // Check if this assistant is already in the valid list
    let existingAssistant = this.report.details.validAssistants.find(
      va => va.tenantId === tenantId && va.assistantId === assistantId
    );

    if (existingAssistant) {
      // Add source if not already present
      if (!existingAssistant.sources.includes(source)) {
        existingAssistant.sources.push(source);
      }
    } else {
      // Create new valid assistant entry
      this.report.details.validAssistants.push({
        tenantId,
        assistantId,
        name,
        sources: [source]
      });
      this.report.summary.validReferencesFound++;
    }
  }

  /**
   * Remove orphaned reference from System A (tenant_settings)
   */
  private async removeSystemAReference(tenantId: string, assistantId: string): Promise<void> {
    try {
      // Get current settings
      const { data: existing } = await supabase
        .from('tenant_settings')
        .select('settings_json')
        .eq('tenant_id', tenantId)
        .single();

      if (existing?.settings_json) {
        const currentSettings = existing.settings_json as any;
        
        // Remove the openai_assistant_id field
        const { openai_assistant_id, ...updatedSettings } = currentSettings;
        
        // Update the record
        const { error } = await supabase
          .from('tenant_settings')
          .update({ settings_json: updatedSettings })
          .eq('tenant_id', tenantId);

        if (error) {
          throw new Error(`Failed to update tenant_settings: ${error.message}`);
        }

        console.log(`[AssistantCleanup] Removed System A reference: tenant ${tenantId}, assistant ${assistantId}`);
      }
    } catch (error) {
      console.error(`[AssistantCleanup] Error removing System A reference:`, error);
      throw error;
    }
  }

  /**
   * Remove orphaned reference from System B (ai_chat_fully_managed_assistants)
   */
  private async removeSystemBReference(tenantId: string, assistantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_chat_fully_managed_assistants')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('assistant_id', assistantId);

      if (error) {
        throw new Error(`Failed to delete from ai_chat_fully_managed_assistants: ${error.message}`);
      }

      console.log(`[AssistantCleanup] Removed System B reference: tenant ${tenantId}, assistant ${assistantId}`);
    } catch (error) {
      console.error(`[AssistantCleanup] Error removing System B reference:`, error);
      throw error;
    }
  }

  /**
   * Generate a human-readable report
   */
  generateReport(): string {
    const { summary, details } = this.report;
    
    let report = `# Assistant Cleanup Report\n\n`;
    report += `**Mode**: ${this.dryRun ? 'Dry Run (no changes made)' : 'Execute (changes applied)'}\n`;
    report += `**Date**: ${new Date().toISOString()}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Total tenants checked**: ${summary.totalTenantsChecked}\n`;
    report += `- **Orphaned references found**: ${summary.orphanedReferencesFound}\n`;
    report += `- **Valid assistants found**: ${summary.validReferencesFound}\n`;
    
    if (!this.dryRun) {
      report += `- **Orphaned references removed**: ${summary.orphanedReferencesRemoved}\n`;
    }
    
    if (summary.errors.length > 0) {
      report += `- **Errors encountered**: ${summary.errors.length}\n`;
    }
    
    report += `\n## Orphaned References\n\n`;
    
    if (details.systemA.length > 0) {
      report += `### System A (tenant_settings)\n\n`;
      for (const orphan of details.systemA) {
        report += `- **Tenant**: ${orphan.tenantId}\n`;
        report += `  - **Assistant ID**: ${orphan.assistantId}\n`;
        report += `  - **Reason**: ${orphan.reason}\n\n`;
      }
    }
    
    if (details.systemB.length > 0) {
      report += `### System B (ai_chat_fully_managed_assistants)\n\n`;
      for (const orphan of details.systemB) {
        report += `- **Tenant**: ${orphan.tenantId}\n`;
        report += `  - **Assistant ID**: ${orphan.assistantId}\n`;
        report += `  - **Reason**: ${orphan.reason}\n\n`;
      }
    }
    
    if (details.validAssistants.length > 0) {
      report += `## Valid Assistants\n\n`;
      for (const valid of details.validAssistants) {
        report += `- **Tenant**: ${valid.tenantId}\n`;
        report += `  - **Assistant ID**: ${valid.assistantId}\n`;
        report += `  - **Name**: ${valid.name}\n`;
        report += `  - **Sources**: ${valid.sources.join(', ')}\n\n`;
      }
    }
    
    if (summary.errors.length > 0) {
      report += `## Errors\n\n`;
      for (const error of summary.errors) {
        report += `- ${error}\n`;
      }
    }
    
    return report;
  }
}

/**
 * Convenience function to run cleanup utility
 */
export async function runAssistantCleanup(dryRun: boolean = true): Promise<CleanupReport> {
  const utility = new AssistantCleanupUtility(dryRun);
  return await utility.runCleanup();
}

/**
 * CLI interface for running cleanup
 */
export async function runCleanupCLI(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');
  
  console.log('='.repeat(60));
  console.log('Assistant Cleanup Utility');
  console.log('='.repeat(60));
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('   Use --execute flag to apply changes');
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be applied!');
  }
  
  console.log('');
  
  try {
    const utility = new AssistantCleanupUtility(isDryRun);
    const report = await utility.runCleanup();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('CLEANUP REPORT');
    console.log('='.repeat(60));
    console.log(utility.generateReport());
    
    if (isDryRun && report.summary.orphanedReferencesFound > 0) {
      console.log('');
      console.log('💡 To apply these changes, run with --execute flag');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// If this file is run directly, execute the CLI
if (require.main === module) {
  runCleanupCLI();
}