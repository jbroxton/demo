// IMPORTANT: This file should only be imported from server components or API routes
import { Attachment, AttachmentType, CreateAttachmentRequest, EntityType } from '@/types/models/Attachment';
import { getDb } from './db.server';
import { v4 as uuidv4 } from 'uuid';

// Note: Table schema is defined in db.server.ts for consistency

// Helper function to map DB row to Attachment object
function mapAttachment(row: any): Attachment {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    type: row.type as AttachmentType,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    entityId: row.entity_id,
    entityType: row.entity_type as EntityType,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined
  };
}

// Extract metadata from URL based on service
export async function extractUrlMetadata(url: string): Promise<{
  title: string;
  type: AttachmentType;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}> {
  // Basic implementation that extracts from URL patterns
  if (url.includes('figma.com')) {
    // Figma implementation
    return {
      title: extractTitleFromUrl(url) || 'Figma Design',
      type: 'figma',
      metadata: { service: 'figma' }
    };
  } else if (url.includes('docs.google.com')) {
    // Google Docs implementation
    return {
      title: extractTitleFromUrl(url) || 'Google Document',
      type: 'googleDoc',
      metadata: { service: 'googleDocs' }
    };
  } else if (url.includes('miro.com')) {
    // Miro implementation
    return {
      title: extractTitleFromUrl(url) || 'Miro Board',
      type: 'miro',
      metadata: { service: 'miro' }
    };
  } else if (url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
    // Image implementation
    return {
      title: extractTitleFromUrl(url) || 'Image',
      type: 'image',
      thumbnailUrl: url,
      metadata: { contentType: 'image' }
    };
  } else if (url.match(/\.(pdf)$/i)) {
    // PDF implementation
    return {
      title: extractTitleFromUrl(url) || 'PDF Document',
      type: 'pdf',
      metadata: { contentType: 'pdf' }
    };
  }

  // Default generic handling
  return {
    title: extractTitleFromUrl(url) || 'Untitled Link',
    type: 'generic'
  };
}

// Helper function to extract a title from URL
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';
    // Remove extension and replace hyphens/underscores with spaces
    return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  } catch (e) {
    console.error('Error extracting title from URL:', e);
    return '';
  }
}

// Create a new attachment
export async function createAttachmentInDb(
  attachment: Omit<CreateAttachmentRequest, 'id'> & { tenantId: string }
): Promise<{ success: boolean; data?: Attachment; error?: string }> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    // Extract metadata if not provided
    let type: AttachmentType = 'generic';
    let title = attachment.title || '';
    let thumbnailUrl = attachment.thumbnailUrl;
    let metadata = {};

    // If no title provided, try to extract from URL
    if (!title) {
      const extractedData = await extractUrlMetadata(attachment.url);
      title = extractedData.title;
      type = extractedData.type;
      thumbnailUrl = thumbnailUrl || extractedData.thumbnailUrl;
      metadata = extractedData.metadata || {};
    }

    // Insert into database
    db.prepare(`
      INSERT INTO attachments (
        id, title, url, type, thumbnail_url,
        created_at, updated_at, entity_id, entity_type, metadata, tenant_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title,
      attachment.url,
      type,
      thumbnailUrl || null,
      now,
      now,
      attachment.entityId,
      attachment.entityType,
      JSON.stringify(metadata),
      attachment.tenantId
    );

    // Return created attachment
    return {
      success: true,
      data: {
        id,
        title,
        url: attachment.url,
        type,
        thumbnailUrl,
        createdAt: now,
        updatedAt: now,
        entityId: attachment.entityId,
        entityType: attachment.entityType,
        metadata
      }
    };
  } catch (error) {
    console.error('Error creating attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when creating attachment'
    };
  }
}

// Get attachments for an entity
export async function getAttachmentsForEntityFromDb(
  entityId: string, 
  entityType: EntityType,
  tenantId: string
): Promise<{ success: boolean; data?: Attachment[]; error?: string }> {
  const db = getDb();

  try {
    // Apply pagination for better performance with large datasets
    const page = 1;
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    const rows = db.prepare(`
      SELECT * FROM attachments
      WHERE entity_id = ? AND entity_type = ? AND tenant_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(entityId, entityType, tenantId, pageSize, offset);

    // Map rows to Attachment objects
    const attachments = rows.map(mapAttachment);

    return { 
      success: true, 
      data: attachments 
    };
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when fetching attachments'
    };
  }
}

// Get attachments from parent entity (e.g., get feature attachments for a requirement)
export async function getParentEntityAttachmentsFromDb(
  entityId: string,
  entityType: EntityType,
  tenantId: string
): Promise<{ 
  success: boolean; 
  data?: { parentType: EntityType | null; parentId: string | null; attachments: Attachment[] }; 
  error?: string 
}> {
  const db = getDb();

  try {
    // Only requirements have parent entities (features) that can have attachments
    if (entityType === 'requirement') {
      // Get the parent feature ID
      const requirement = db.prepare(
        'SELECT featureId FROM requirements WHERE id = ? AND tenantId = ?'
      ).get(entityId, tenantId) as { featureId?: string } | undefined;

      if (requirement && requirement.featureId) {
        // Get attachments for the parent feature
        const result = await getAttachmentsForEntityFromDb(
          requirement.featureId,
          'feature',
          tenantId
        );

        if (result.success && result.data) {
          return {
            success: true,
            data: {
              parentType: 'feature',
              parentId: requirement.featureId,
              attachments: result.data
            }
          };
        }
      }
    }

    // No parent attachments found
    return {
      success: true,
      data: {
        parentType: null,
        parentId: null,
        attachments: []
      }
    };
  } catch (error) {
    console.error('Error fetching parent attachments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when fetching parent attachments'
    };
  }
}

// Get a single attachment by ID
export async function getAttachmentByIdFromDb(
  id: string,
  tenantId: string
): Promise<{ success: boolean; data?: Attachment; error?: string }> {
  const db = getDb();

  try {
    const row = db.prepare(
      'SELECT * FROM attachments WHERE id = ? AND tenant_id = ?'
    ).get(id, tenantId);

    if (!row) {
      return {
        success: false,
        error: 'Attachment not found'
      };
    }

    return {
      success: true,
      data: mapAttachment(row)
    };
  } catch (error) {
    console.error('Error fetching attachment by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when fetching attachment'
    };
  }
}

// Update an attachment
export async function updateAttachmentInDb(
  id: string,
  updates: Partial<Omit<Attachment, 'id' | 'createdAt' | 'updatedAt' | 'entityId' | 'entityType'>>,
  tenantId: string
): Promise<{ success: boolean; data?: Attachment; error?: string }> {
  const db = getDb();
  const now = new Date().toISOString();

  try {
    // Get the current attachment
    const current = await getAttachmentByIdFromDb(id, tenantId);
    if (!current.success || !current.data) {
      return {
        success: false,
        error: current.error || 'Attachment not found'
      };
    }

    // Build update parts
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(updates.title);
    }

    if (updates.url !== undefined) {
      updateFields.push('url = ?');
      updateValues.push(updates.url);
    }

    if (updates.type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(updates.type);
    }

    if (updates.thumbnailUrl !== undefined) {
      updateFields.push('thumbnail_url = ?');
      updateValues.push(updates.thumbnailUrl);
    }

    if (updates.metadata !== undefined) {
      updateFields.push('metadata = ?');
      updateValues.push(JSON.stringify(updates.metadata));
    }

    // Add updated_at
    updateFields.push('updated_at = ?');
    updateValues.push(now);

    // Add id and tenantId for WHERE clause
    updateValues.push(id);
    updateValues.push(tenantId);

    // Execute update
    if (updateFields.length > 0) {
      const query = `
        UPDATE attachments 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND tenant_id = ?
      `;
      
      db.prepare(query).run(...updateValues);
    }

    // Get updated attachment
    const updated = await getAttachmentByIdFromDb(id, tenantId);
    return updated;
  } catch (error) {
    console.error('Error updating attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when updating attachment'
    };
  }
}

// Delete an attachment
export async function deleteAttachmentFromDb(
  id: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();

  try {
    // Verify the attachment exists and belongs to the tenant
    const attachment = db.prepare(
      'SELECT id FROM attachments WHERE id = ? AND tenant_id = ?'
    ).get(id, tenantId);

    if (!attachment) {
      return {
        success: false,
        error: 'Attachment not found or you do not have permission to delete it'
      };
    }

    // Delete the attachment
    db.prepare(
      'DELETE FROM attachments WHERE id = ? AND tenant_id = ?'
    ).run(id, tenantId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when deleting attachment'
    };
  }
}

// Schema initialization is handled in db.server.ts