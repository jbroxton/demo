import { supabase } from './supabase';
import { Document } from '@/types/models';

// Get all documents or filter by featureId or releaseId
export async function getDocumentsFromDb(
  tenantId: string = 'org1',
  featureId?: string,
  releaseId?: string
) {
  try {
    console.log(`Getting documents for tenant: ${tenantId}, feature: ${featureId || 'any'}, release: ${releaseId || 'any'}`);

    // Verify we have a tenant ID
    if (!tenantId) {
      console.error('No tenant ID provided for getDocumentsFromDb');
      return {
        success: false,
        error: 'Tenant ID is required'
      };
    }

    // Build query
    let query = supabase
      .from('documents')
      .select('*')
      .eq('tenant_id', tenantId);

    // Add filters if provided
    if (featureId) {
      query = query.eq('feature_id', featureId);
    }

    if (releaseId) {
      query = query.eq('release_id', releaseId);
    }

    // Order by most recently updated
    query = query.order('updated_at', { ascending: false });

    console.log(`Executing query for tenant: ${tenantId}`);

    const { data, error } = await query;

    if (error) {
      console.error('Error executing query:', error);
      return {
        success: false,
        error: `Database query error: ${error.message}`
      };
    }

    console.log(`Query returned ${data?.length || 0} documents`);

    // Safely map documents with error handling
    try {
      const mappedDocuments = (data || []).map((doc) => {
        try {
          return mapDocumentFromDb(doc);
        } catch (mapError) {
          console.error(`Error mapping document ${doc?.id || 'unknown'}:`, mapError);
          // Return a partial document rather than failing completely
          return {
            id: doc?.id || 'error',
            title: doc?.title || 'Error loading document',
            content: { type: 'doc', content: [] },
            tenantId: doc?.tenant_id || tenantId,
            createdAt: doc?.created_at || new Date().toISOString(),
            updatedAt: doc?.updated_at || new Date().toISOString()
          } as Document;
        }
      });

      return {
        success: true,
        data: mappedDocuments
      };
    } catch (mapError) {
      console.error('Error mapping documents:', mapError);
      return {
        success: false,
        error: 'Failed to process document data'
      };
    }
  } catch (error) {
    console.error('Error getting documents:', error);
    return {
      success: false,
      error: `Failed to retrieve documents: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Get a single document by ID
export async function getDocumentFromDb(id: string, tenantId: string = 'org1') {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (error) {
      console.error('Error getting document:', error);
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    return {
      success: true,
      data: mapDocumentFromDb(document)
    };
  } catch (error) {
    console.error('Error getting document:', error);
    return {
      success: false,
      error: 'Failed to retrieve document'
    };
  }
}

// Create a new document
export async function createDocumentInDb(
  document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>,
  tenantId: string = 'org1'
) {
  try {
    if (!document.title) {
      console.error('Title is required for document creation');
      return {
        success: false,
        error: 'Title is required'
      };
    }

    console.log(`Creating document "${document.title}" in tenant ${tenantId}`);

    // Format content as needed
    let contentToStore;
    try {
      contentToStore = typeof document.content === 'string'
        ? document.content
        : JSON.stringify(document.content);
    } catch (contentError) {
      console.error('Error stringifying content:', contentError);
      return {
        success: false,
        error: 'Invalid document content format'
      };
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        content: contentToStore,
        feature_id: document.featureId || null,
        release_id: document.releaseId || null,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting document:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    console.log(`Document inserted successfully with ID: ${data.id}`);

    return {
      success: true,
      data: mapDocumentFromDb(data)
    };
  } catch (error) {
    console.error('Error creating document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create document: ${errorMessage}`
    };
  }
}

// Update a document
export async function updateDocumentInDb(
  id: string,
  updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>,
  tenantId: string = 'org1'
) {
  try {
    // First, check if document exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (checkError || !existing) {
      return {
        success: false,
        error: 'Document not found or access denied'
      };
    }
    
    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    
    if (updates.content !== undefined) {
      updateData.content = typeof updates.content === 'string' 
        ? updates.content 
        : JSON.stringify(updates.content);
    }
    
    if (updates.featureId !== undefined) {
      updateData.feature_id = updates.featureId || null;
    }
    
    if (updates.releaseId !== undefined) {
      updateData.release_id = updates.releaseId || null;
    }
    
    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document:', error);
      return {
        success: false,
        error: 'Failed to update document'
      };
    }
    
    return {
      success: true,
      data: mapDocumentFromDb(data)
    };
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      success: false,
      error: 'Failed to update document'
    };
  }
}

// Delete a document
export async function deleteDocumentFromDb(id: string, tenantId: string = 'org1') {
  try {
    // First, check if document exists and belongs to tenant
    const { data: existing, error: checkError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (checkError || !existing) {
      return {
        success: false,
        error: 'Document not found or access denied'
      };
    }
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        error: 'Failed to delete document'
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: 'Failed to delete document'
    };
  }
}

// Helper function to map DB row to camelCase Document object
function mapDocumentFromDb(row: any): Document {
  // Validate required fields exist
  if (!row.id || !row.title) {
    console.error('Invalid document row missing required fields:', row);
    throw new Error('Document is missing required fields');
  }

  // Parse content safely
  let parsedContent: any;
  try {
    if (typeof row.content === 'string') {
      parsedContent = row.content.trim() ? JSON.parse(row.content) : { type: 'doc', content: [] };
    } else {
      parsedContent = row.content || { type: 'doc', content: [] };
    }
  } catch (parseError) {
    console.error(`Error parsing document content for ${row.id}:`, parseError);
    // Return minimal valid content instead of failing
    parsedContent = {
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'Error: Content could not be loaded'
        }]
      }]
    };
  }

  return {
    id: row.id,
    title: row.title || 'Untitled Document',
    content: parsedContent,
    featureId: row.feature_id,
    releaseId: row.release_id,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    tenantId: row.tenant_id
  };
}