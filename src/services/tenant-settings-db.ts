import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { tenantAssistants, isOpenAIConfigured } from '@/lib/openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TenantSettings {
  id: string;
  tenant_id: string;
  settings_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all settings for a tenant
 */
export async function getTenantSettings(tenantId: string): Promise<ServiceResult<TenantSettings | null>> {
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting tenant settings:', error);
      return {
        success: false,
        error: 'Failed to retrieve tenant settings',
      };
    }

    return {
      success: true,
      data: data || null,
    };
  } catch (error) {
    console.error('Error getting tenant settings:', error);
    return {
      success: false,
      error: 'Failed to retrieve tenant settings',
    };
  }
}

/**
 * Update or create tenant settings
 */
export async function updateTenantSettings(
  tenantId: string, 
  settings: Record<string, any>
): Promise<ServiceResult<TenantSettings>> {
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        settings_json: settings,
      }, {
        onConflict: 'tenant_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant settings:', error);
      return {
        success: false,
        error: 'Failed to update tenant settings',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    return {
      success: false,
      error: 'Failed to update tenant settings',
    };
  }
}

/**
 * Get Speqq instructions specifically for Assistant API
 */
export async function getSpeqqInstructions(tenantId: string): Promise<ServiceResult<string>> {
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .select('settings_json->speqq_instructions')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting Speqq instructions:', error);
      return {
        success: false,
        error: 'Failed to retrieve Speqq instructions',
      };
    }

    // Return instructions or default template
    const instructions = (typeof data?.speqq_instructions === 'string' && data.speqq_instructions.trim() !== '')
      ? data.speqq_instructions 
      : getDefaultSpeqqTemplate();

    return {
      success: true,
      data: instructions,
    };
  } catch (error) {
    console.error('Error getting Speqq instructions:', error);
    return {
      success: false,
      error: 'Failed to retrieve Speqq instructions',
    };
  }
}

/**
 * Update just the Speqq instructions section and sync with OpenAI Assistant
 */
export async function updateSpeqqInstructions(
  tenantId: string, 
  instructions: string
): Promise<ServiceResult<TenantSettings>> {
  try {
    // First get existing settings
    const existingResult = await getTenantSettings(tenantId);
    const existingSettings = existingResult.data?.settings_json || {};

    // Update just the speqq_instructions field
    const updatedSettings = {
      ...existingSettings,
      speqq_instructions: instructions,
    };

    // Save to database first
    const updateResult = await updateTenantSettings(tenantId, updatedSettings);
    if (!updateResult.success) {
      return updateResult;
    }

    // Sync with OpenAI Assistant API if configured
    if (isOpenAIConfigured()) {
      try {
        const fullInstructions = buildAssistantInstructions(instructions);
        await tenantAssistants.updateInstructions(tenantId, fullInstructions);
      } catch (assistantError) {
        console.warn('Failed to sync with OpenAI Assistant, but settings saved:', assistantError);
        // Don't fail the whole operation if Assistant sync fails
      }
    }

    return updateResult;
  } catch (error) {
    console.error('Error updating Speqq instructions:', error);
    return {
      success: false,
      error: 'Failed to update Speqq instructions',
    };
  }
}

/**
 * Get the default Speqq.md template from file
 */
export function getDefaultSpeqqTemplate(): string {
  try {
    const templatePath = join(process.cwd(), 'src', 'system-prompts', 'speqq-default-template.md');
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error('Error loading default Speqq template:', error);
    // Fallback template if file can't be read
    return `# Speqq Configuration

## Company
- **Name:** [Company name]
- **Product:** [Brief description]
- **Industry:** [Vertical]
- **Stage:** [Startup/Growth/Enterprise]

## Team
- **Size:** [Number]
- **Role:** [Your role]
- **Method:** [Agile/Lean/etc]

## Product
- **Users:** [Target audience]
- **Value:** [Key benefit]
- **Model:** [Business model]
- **Success:** [Key metrics]

## Style
- **Tone:** [Communication preference]
- **Focus:** [Strategy/Execution/Research]

## Notes
[Additional context]`;
  }
}

/**
 * Get the base instructions from file
 */
function getBaseInstructions(): string {
  try {
    const instructionsPath = join(process.cwd(), 'src', 'system-prompts', 'speqq-base-instructions.md');
    return readFileSync(instructionsPath, 'utf-8');
  } catch (error) {
    console.error('Error loading base instructions:', error);
    // Fallback instructions if file can't be read
    return `You are Speqq AI, an expert product management assistant. Provide actionable, data-driven guidance using established PM frameworks. Always consider business context, ask clarifying questions, and balance short/long-term strategy.

Response format: Clear headings, bullet points, specific examples, measurable success criteria. Reference user's product data when relevant.

Focus: Product strategy, execution, research, analytics. Maintain professional tone. You have access to user's features, requirements, roadmaps, and metrics.`;
  }
}

/**
 * Build complete Assistant API instructions (base + user context)
 */
export function buildAssistantInstructions(speqqContent: string): string {
  const baseInstructions = getBaseInstructions();
  const userContext = speqqContent?.trim() || getDefaultSpeqqTemplate();
  
  return `${baseInstructions}\n\n--- COMPANY CONTEXT ---\n${userContext}`;
}

/**
 * Get the OpenAI Assistant ID for a tenant (creates if needed)
 */
export async function getTenantAssistantId(tenantId: string): Promise<ServiceResult<string>> {
  try {
    if (!isOpenAIConfigured()) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    // Get current instructions for the assistant
    const instructionsResult = await getSpeqqInstructions(tenantId);
    const fullInstructions = buildAssistantInstructions(instructionsResult.data || '');

    // Get or create assistant through centralized manager
    const assistantId = await tenantAssistants.getAssistantId(tenantId, fullInstructions);

    return {
      success: true,
      data: assistantId,
    };
  } catch (error) {
    console.error('Error getting tenant assistant ID:', error);
    return {
      success: false,
      error: 'Failed to get assistant ID',
    };
  }
}