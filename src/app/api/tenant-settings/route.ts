import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getTenantSettings, 
  updateTenantSettings,
  getSpeqqInstructions,
  updateSpeqqInstructions,
  getDefaultSpeqqTemplate 
} from '@/services/tenant-settings-db';

/**
 * GET /api/tenant-settings
 * Get all settings for the current tenant
 * Query params:
 * - speqq_only: if true, returns only Speqq instructions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant associated with user' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const speqqOnly = searchParams.get('speqq_only') === 'true';

    if (speqqOnly) {
      // Return only Speqq instructions
      const result = await getSpeqqInstructions(tenantId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        speqq_instructions: result.data 
      });
    } else {
      // Return all tenant settings
      const result = await getTenantSettings(tenantId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      // If no settings exist, return default structure
      if (!result.data) {
        return NextResponse.json({
          settings: {
            speqq_instructions: getDefaultSpeqqTemplate()
          },
          exists: false
        });
      }

      return NextResponse.json({
        settings: result.data.settings_json,
        exists: true,
        updated_at: result.data.updated_at
      });
    }
  } catch (error) {
    console.error('Error in GET /api/tenant-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenant-settings
 * Update tenant settings
 * Body can contain:
 * - settings: full settings object to replace existing
 * - speqq_instructions: just update Speqq instructions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant associated with user' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (body.speqq_instructions !== undefined) {
      // Update only Speqq instructions
      const result = await updateSpeqqInstructions(tenantId, body.speqq_instructions);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        settings: result.data?.settings_json || {},
        updated_at: result.data?.updated_at || new Date().toISOString()
      });
    } else if (body.settings) {
      // Update full settings
      const result = await updateTenantSettings(tenantId, body.settings);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        settings: result.data?.settings_json || {},
        updated_at: result.data?.updated_at || new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: 'Request must include either "settings" or "speqq_instructions"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/tenant-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tenant-settings
 * Alias for POST - same functionality
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}