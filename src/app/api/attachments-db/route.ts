import { NextRequest, NextResponse } from 'next/server';
import {
  createAttachmentInDb,
  deleteAttachmentFromDb,
  getAttachmentByIdFromDb,
  getAttachmentsForEntityFromDb,
  updateAttachmentInDb
} from '@/services/attachments-db';
import { EntityType } from '@/types/models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper to get tenant ID from session
async function getTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.currentTenant || null;
}

// GET handler for fetching attachments
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId');
    const entityType = url.searchParams.get('entityType');
    const id = url.searchParams.get('id');
    
    // Get tenant ID from session
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // If ID is provided, get a single attachment
    if (id) {
      const result = await getAttachmentByIdFromDb(id, tenantId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.data);
    }
    
    // Otherwise, get attachments for an entity
    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'Entity ID and type are required' },
        { status: 400 }
      );
    }

    const result = await getAttachmentsForEntityFromDb(
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
    console.error('Error in attachments GET:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST handler for creating a new attachment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get tenant ID from session
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.url || !body.entityId || !body.entityType) {
      return NextResponse.json(
        { error: 'URL, entity ID, and entity type are required' },
        { status: 400 }
      );
    }

    const result = await createAttachmentInDb({
      title: body.title,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      entityId: body.entityId,
      entityType: body.entityType,
      tenantId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in attachments POST:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating an attachment
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get tenant ID from session
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    const result = await updateAttachmentInDb(
      body.id,
      {
        title: body.title,
        url: body.url,
        type: body.type,
        thumbnailUrl: body.thumbnailUrl,
        metadata: body.metadata
      },
      tenantId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in attachments PATCH:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing an attachment
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Get tenant ID from session
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteAttachmentFromDb(id, tenantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in attachments DELETE:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}