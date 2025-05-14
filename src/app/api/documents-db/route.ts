import { NextRequest, NextResponse } from 'next/server';
import {
  getDocumentsFromDb,
  getDocumentFromDb,
  createDocumentInDb,
  updateDocumentInDb,
  deleteDocumentFromDb
} from '@/services/documents-db';
import { getTenantFromRequest } from '@/utils/server-tenant-utils';

// Fallback function for tenant identification in case of import issues
function getDefaultTenant(_request: Request): string {
  console.log('Using fallback tenant function');
  return 'org1';
}

// GET - Retrieve document(s)
export async function GET(request: NextRequest) {
  try {
    console.log('Documents API - GET request received');

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const featureId = searchParams.get('featureId');
    const releaseId = searchParams.get('releaseId');

    // Get tenant information with fallback
    let tenantId: string;
    try {
      tenantId = getTenantFromRequest(request);
    } catch (tenantError) {
      console.error('Error using getTenantFromRequest:', tenantError);
      tenantId = getDefaultTenant(request);
    }

    // Ensure we have a valid tenant ID
    if (!tenantId) {
      console.error('No tenant ID available for documents request');
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    console.log(`Documents API Request - ID: ${id}, Feature: ${featureId}, Release: ${releaseId}, Tenant: ${tenantId}`);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    // If ID is provided, get a specific document
    if (id) {
      console.log(`GET request for specific document: ${id}`);
      const result = getDocumentFromDb(id, tenantId);

      if (!result.success) {
        console.log(`Document GET error - ID ${id}:`, result.error);
        return NextResponse.json({ error: result.error }, { status: 404 });
      }

      if (!result.data) {
        console.log(`Document not found - ID ${id}`);
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      console.log(`Document GET success - ID ${id}`);
      return NextResponse.json(result.data);
    }

    // Otherwise, get all documents, optionally filtered
    console.log('GET request for all documents with filters:', { featureId, releaseId });

    try {
      const result = getDocumentsFromDb(tenantId, featureId || undefined, releaseId || undefined);

      if (!result.success) {
        console.log(`Documents GET error:`, result.error);
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      console.log(`Documents GET success - Found ${Array.isArray(result.data) ? result.data.length : 0} documents`);

      // Ensure we always return an array, even if result.data is undefined
      const documentsArray = Array.isArray(result.data) ? result.data : [];
      return NextResponse.json(documentsArray);
    } catch (getError) {
      console.error('Error getting documents from database:', getError);
      return NextResponse.json(
        { error: `Database error: ${getError instanceof Error ? getError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in documents-db GET:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

// POST - Create a new document
export async function POST(request: NextRequest) {
  try {
    console.log('POST request received to create document');

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.title) {
      console.log('Missing title in request');
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Ensure content is provided
    if (!body.content) {
      console.log('No content provided, using default content');
      body.content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: ''
              }
            ]
          }
        ]
      };
    }

    // Get tenant information with fallback
    let tenantId: string;
    try {
      tenantId = getTenantFromRequest(request);
    } catch (tenantError) {
      console.error('Error using getTenantFromRequest in POST:', tenantError);
      tenantId = getDefaultTenant(request);
    }
    console.log(`Using tenant ID: ${tenantId}`);

    // Create the document
    console.log('Calling createDocumentInDb...');
    const result = createDocumentInDb(body, tenantId);

    if (!result.success) {
      console.error(`Document creation failed: ${result.error}`);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log(`Document created successfully with ID: ${result.data?.id}`);
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in documents-db POST:', error);
    // Provide more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error details: ${errorMessage}`);
    return NextResponse.json({ error: `Failed to process request: ${errorMessage}` }, { status: 500 });
  }
}

// PUT - Update an existing document
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Get tenant information with fallback
    let tenantId: string;
    try {
      tenantId = getTenantFromRequest(request);
    } catch (tenantError) {
      console.error('Error using getTenantFromRequest in PUT:', tenantError);
      tenantId = getDefaultTenant(request);
    }

    // Update the document
    const result = updateDocumentInDb(id, body, tenantId);

    if (!result.success) {
      const errorMessage = result.error || 'Failed to update document';
      return NextResponse.json({ error: errorMessage }, { status: errorMessage.includes('not found') ? 404 : 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in documents-db PUT:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    // Get tenant information with fallback
    let tenantId: string;
    try {
      tenantId = getTenantFromRequest(request);
    } catch (tenantError) {
      console.error('Error using getTenantFromRequest in DELETE:', tenantError);
      tenantId = getDefaultTenant(request);
    }

    // Delete the document
    const result = deleteDocumentFromDb(id, tenantId);

    if (!result.success) {
      const errorMessage = result.error || 'Failed to delete document';
      return NextResponse.json({ error: errorMessage }, { status: errorMessage.includes('not found') ? 404 : 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in documents-db DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}