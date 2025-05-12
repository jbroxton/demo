import { NextRequest, NextResponse } from 'next/server';
import { getParentEntityAttachmentsFromDb } from '@/services/attachments-db';
import { EntityType } from '@/types/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get tenant ID from session
async function getTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.currentTenant || null;
}

// GET handler for fetching inherited attachments
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');
    const entityType = url.searchParams.get('entityType');
    
    // Get tenant ID from session
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'Entity ID and type are required' },
        { status: 400 }
      );
    }

    const result = await getParentEntityAttachmentsFromDb(
      entityId,
      entityType as EntityType,
      tenantId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in inherited attachments GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}