import { supabase } from './supabase';
import { Document } from '@/types/models';

// Get all documents or filter by featureId or releaseId
export async function getDocumentsFromDb(
  tenantId: string, // No default, must be provided from auth context
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
export async function getDocumentFromDb(id: string, tenantId: string) {
  try {
    console.log(`Getting document ID: ${id} for tenant: ${tenantId}`);
    
    if (!tenantId) {
      console.error('No tenant ID provided for getDocumentFromDb');
      return {
        success: false,
        error: 'Tenant ID is required'
      };
    }
    
    // First check if document exists
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error retrieving document ${id}:`, error);
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    if (!document) {
      console.error(`Document with ID ${id} does not exist`);
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    // Check tenant ID match
    if (document.tenant_id !== tenantId) {
      console.error(`Tenant ID mismatch: Document belongs to tenant ${document.tenant_id}, but request from ${tenantId}`);
      return {
        success: false,
        error: 'Access denied. Document belongs to a different tenant.'
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
  tenantId: string
) {
  try {
    console.log(`Creating document in tenant ${tenantId}:`, document);
    
    if (!tenantId) {
      console.error('No tenant ID provided for createDocumentInDb');
      return {
        success: false,
        error: 'Tenant ID is required'
      };
    }
    
    if (!document.title) {
      console.error('Title is required for document creation');
      return {
        success: false,
        error: 'Title is required'
      };
    }
    
    // Verify we have at least one entity ID
    if (!document.featureId && !document.releaseId && !document.requirementId) {
      console.error('Document must be associated with at least one entity');
      return {
        success: false,
        error: 'At least one of featureId, releaseId, or requirementId is required'
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
  tenantId: string
) {
  try {
    // Enhanced logging
    console.log(`Checking document existence for update - ID: ${id} in tenant: ${tenantId}`);
    console.log('Updates object:', JSON.stringify(updates, null, 2));
    
    // First check if the document exists at all
    const { data: documentExists, error: existsError } = await supabase
      .from('documents')
      .select('id, tenant_id, title, feature_id, release_id')
      .eq('id', id)
      .single();
      
    if (existsError) {
      console.error(`Document lookup error for ID ${id}:`, existsError);
      return {
        success: false,
        error: `Document not found: ${existsError.message}`
      };
    }
    
    if (!documentExists) {
      console.error(`Document with ID ${id} does not exist`); 
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    // Now check tenant ID match
    if (documentExists.tenant_id !== tenantId) {
      console.error(`Tenant ID mismatch: Document belongs to tenant ${documentExists.tenant_id}, but request from ${tenantId}`);
      return {
        success: false,
        error: 'Access denied. Document belongs to a different tenant.'
      };
    }
    
    console.log(`Found existing document: ${id}, title: "${documentExists.title}", feature_id: ${documentExists.feature_id}`);
    
    // If we get here, document exists and belongs to the tenant
    
    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.title !== undefined) {
      updateData.title = updates.title;
      console.log(`Setting title to: "${updates.title}"`);
    }
    
    if (updates.content !== undefined) {
      try {
        // Make sure content is always stored as a string
        const finalContent = typeof updates.content === 'string' 
          ? updates.content 
          : JSON.stringify(updates.content);
        
        // Validate it's valid JSON before saving
        try {
          // Test if it's valid JSON by trying to parse it
          JSON.parse(finalContent);
          // If it parses, it's valid JSON
          updateData.content = finalContent;
        } catch (jsonError) {
          // Not valid JSON, convert to a basic document structure
          console.warn('Attempted to save invalid JSON content, converting to basic structure');
          updateData.content = JSON.stringify({
            type: 'doc',
            content: [
              { 
                type: 'paragraph', 
                content: [
                  { 
                    type: 'text', 
                    text: typeof updates.content === 'string' 
                      ? updates.content 
                      : 'Content could not be properly formatted'
                  }
                ] 
              }
            ]
          });
        }
        
        console.log(`Setting content (${typeof updates.content}, final length: ${
          updateData.content.length
        })`);
      } catch (e) {
        console.error('Error processing content for storage:', e);
        // Fallback to empty document
        updateData.content = JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }]
        });
      }
    }
    
    if (updates.featureId !== undefined) {
      updateData.feature_id = updates.featureId || null;
      console.log(`Setting feature_id to: ${updates.featureId || 'null'}`);
    }
    
    if (updates.releaseId !== undefined) {
      updateData.release_id = updates.releaseId || null;
      console.log(`Setting release_id to: ${updates.releaseId || 'null'}`);
    }
    
    console.log(`Executing Supabase update for document ${id} with data:`, updateData);
    
    // Use .match condition to be extra explicit about updating this specific document
    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .match({ id: id, tenant_id: tenantId }) // Use match for multiple conditions
      .select()
      .single();
    
    if (error) {
      console.error('Error updating document:', error);
      return {
        success: false,
        error: `Failed to update document: ${error.message}`
      };
    }
    
    if (!data) {
      console.error('No data returned after update');
      return {
        success: false,
        error: 'Document update did not return data'
      };
    }
    
    console.log(`Document ${id} successfully updated`);
    
    return {
      success: true,
      data: mapDocumentFromDb(data)
    };
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      success: false,
      error: `Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Delete a document
export async function deleteDocumentFromDb(id: string, tenantId: string) {
  try {
    console.log(`Checking document existence for deletion - ID: ${id} in tenant: ${tenantId}`); 
    
    // First check if the document exists at all
    const { data: documentExists, error: existsError } = await supabase
      .from('documents')
      .select('id, tenant_id')
      .eq('id', id)
      .single();
      
    if (existsError) {
      console.error(`Document lookup error for ID ${id}:`, existsError);
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    if (!documentExists) {
      console.error(`Document with ID ${id} does not exist`); 
      return {
        success: false,
        error: 'Document not found'
      };
    }
    
    // Now check tenant ID match
    if (documentExists.tenant_id !== tenantId) {
      console.error(`Tenant ID mismatch: Document belongs to tenant ${documentExists.tenant_id}, but request from ${tenantId}`);
      return {
        success: false,
        error: 'Access denied. Document belongs to a different tenant.'
      };
    }
    
    // If we get here, document exists and belongs to the tenant
    
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
    requirementId: row.requirement_id,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString()
    // tenantId is omitted as it's managed by auth context
  };
}