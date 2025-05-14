import { getDb } from './db.server';
import { Document } from '@/types/models';
import crypto from 'crypto';

// Get all documents or filter by featureId or releaseId
export function getDocumentsFromDb(
  tenantId: string,
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

    const db = getDb();
    if (!db) {
      console.error('Failed to get database connection in getDocumentsFromDb');
      return {
        success: false,
        error: 'Database connection error'
      };
    }

    // Verify table exists
    try {
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='documents'").get();
      if (!tableCheck) {
        console.error('Documents table does not exist');
        return {
          success: false,
          error: 'Documents table does not exist'
        };
      }
    } catch (tableError) {
      console.error('Error checking for documents table:', tableError);
      return {
        success: false,
        error: 'Failed to verify schema'
      };
    }

    // Base query
    let query = `
      SELECT * FROM documents
      WHERE tenant_id = ?
    `;

    const params: any[] = [tenantId];

    // Add filters if provided
    if (featureId) {
      query += ` AND featureId = ?`;
      params.push(featureId);
    }

    if (releaseId) {
      query += ` AND releaseId = ?`;
      params.push(releaseId);
    }

    // Order by most recently updated
    query += ` ORDER BY updated_at DESC`;

    console.log(`Executing query: ${query.replace(/\s+/g, ' ')} with params: ${JSON.stringify(params)}`);

    try {
      const documents = db.prepare(query).all(...params);
      console.log(`Query returned ${documents.length} documents`);

      if (!Array.isArray(documents)) {
        console.error('Unexpected result: documents is not an array');
        return {
          success: false,
          error: 'Unexpected database result format'
        };
      }

      // Safely map documents with error handling
      try {
        const mappedDocuments = documents.map((doc) => {
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
    } catch (queryError) {
      console.error('Error executing query:', queryError);
      return {
        success: false,
        error: `Database query error: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`
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
export function getDocumentFromDb(id: string, tenantId: string) {
  try {
    const db = getDb();
    const document = db.prepare(`
      SELECT * FROM documents 
      WHERE id = ? AND tenant_id = ?
    `).get(id, tenantId);
    
    if (!document) {
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
export function createDocumentInDb(
  document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>,
  tenantId: string
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

    const db = getDb();
    if (!db) {
      console.error('Failed to get database connection');
      return {
        success: false,
        error: 'Database connection error'
      };
    }

    // Verify the documents table exists
    try {
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='documents'").get();
      if (!tableCheck) {
        console.error('Documents table does not exist');
        return {
          success: false,
          error: 'Documents table does not exist in database'
        };
      }
    } catch (tableError) {
      console.error('Error checking for documents table:', tableError);
      return {
        success: false,
        error: 'Failed to verify schema'
      };
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

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

    console.log(`Inserting document with ID: ${id}`);

    try {
      db.prepare(`
        INSERT INTO documents (
          id,
          title,
          content,
          featureId,
          releaseId,
          created_at,
          updated_at,
          tenant_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        document.title,
        contentToStore,
        document.featureId || null,
        document.releaseId || null,
        now,
        now,
        tenantId
      );

      console.log(`Document inserted successfully with ID: ${id}`);

      return {
        success: true,
        data: {
          id,
          title: document.title,
          content: document.content,
          featureId: document.featureId,
          releaseId: document.releaseId,
          createdAt: now,
          updatedAt: now,
          tenantId
        }
      };
    } catch (insertError) {
      console.error('Error inserting document:', insertError);
      // Get more specific error message from the SQLite error
      const errorMessage = insertError instanceof Error
        ? insertError.message
        : 'Unknown database error';

      return {
        success: false,
        error: `Database error: ${errorMessage}`
      };
    }
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
export function updateDocumentInDb(
  id: string,
  updates: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>,
  tenantId: string
) {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    
    // First, check if document exists and belongs to tenant
    const existing = db.prepare(`
      SELECT id FROM documents WHERE id = ? AND tenant_id = ?
    `).get(id, tenantId);
    
    if (!existing) {
      return {
        success: false,
        error: 'Document not found or access denied'
      };
    }
    
    // Build dynamic update query based on provided fields
    const updateFields: string[] = ['updated_at = ?'];
    const updateValues: any[] = [now];
    
    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(updates.title);
    }
    
    if (updates.content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(
        typeof updates.content === 'string' 
          ? updates.content 
          : JSON.stringify(updates.content)
      );
    }
    
    if (updates.featureId !== undefined) {
      updateFields.push('featureId = ?');
      updateValues.push(updates.featureId || null);
    }
    
    if (updates.releaseId !== undefined) {
      updateFields.push('releaseId = ?');
      updateValues.push(updates.releaseId || null);
    }
    
    // Add ID and tenantId to the values array for the WHERE clause
    updateValues.push(id, tenantId);
    
    const query = `
      UPDATE documents
      SET ${updateFields.join(', ')}
      WHERE id = ? AND tenant_id = ?
    `;
    
    db.prepare(query).run(...updateValues);
    
    // Fetch the updated document
    const result = getDocumentFromDb(id, tenantId);
    
    return result;
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      success: false,
      error: 'Failed to update document'
    };
  }
}

// Delete a document
export function deleteDocumentFromDb(id: string, tenantId: string) {
  try {
    const db = getDb();
    
    // First, check if document exists and belongs to tenant
    const existing = db.prepare(`
      SELECT id FROM documents WHERE id = ? AND tenant_id = ?
    `).get(id, tenantId);
    
    if (!existing) {
      return {
        success: false,
        error: 'Document not found or access denied'
      };
    }
    
    db.prepare(`
      DELETE FROM documents
      WHERE id = ? AND tenant_id = ?
    `).run(id, tenantId);
    
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
    featureId: row.featureId,
    releaseId: row.releaseId,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    tenantId: row.tenant_id
  };
}