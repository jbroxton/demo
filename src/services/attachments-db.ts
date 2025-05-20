// IMPORTANT: This file should only be imported from server components or API routes
import { supabase } from './supabase';
import { Attachment, AttachmentType, CreateAttachmentRequest, EntityType } from '@/types/models/Attachment';

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
    metadata: row.metadata || undefined
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

// Get all attachments for a tenant
export async function getAttachmentsFromDb(
  tenantId: string
): Promise<{ success: boolean; data?: Attachment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: (data || []).map(mapAttachment)
    };
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when fetching attachments'
    };
  }
}

// Create a new attachment
export async function createAttachmentInDb(
  attachment: CreateAttachmentRequest,
  tenantId: string
): Promise<{ success: boolean; data?: Attachment; error?: string }> {
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
    const { data, error } = await supabase
      .from('attachments')
      .insert({
        title,
        url: attachment.url,
        type,
        thumbnail_url: thumbnailUrl || null,
        entity_id: attachment.entityId,
        entity_type: attachment.entityType,
        metadata,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attachment:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Return created attachment
    return {
      success: true,
      data: mapAttachment(data)
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
  try {
    // Apply pagination for better performance with large datasets
    const page = 1;
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching attachments:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Map rows to Attachment objects
    const attachments = (data || []).map(mapAttachment);

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
  try {
    // Only requirements have parent entities (features) that can have attachments
    if (entityType === 'requirement') {
      // Get the parent feature ID
      const { data: requirement, error } = await supabase
        .from('requirements')
        .select('feature_id')
        .eq('id', entityId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        console.error('Error fetching requirement:', error);
        // No parent found - not an error, just return empty
        return {
          success: true,
          data: {
            parentType: null,
            parentId: null,
            attachments: []
          }
        };
      }

      if (requirement && requirement.feature_id) {
        // Get attachments for the parent feature
        const result = await getAttachmentsForEntityFromDb(
          requirement.feature_id,
          'feature',
          tenantId
        );

        if (result.success && result.data) {
          return {
            success: true,
            data: {
              parentType: 'feature',
              parentId: requirement.feature_id,
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
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching attachment by ID:', error);
      return {
        success: false,
        error: 'Attachment not found'
      };
    }

    return {
      success: true,
      data: mapAttachment(data)
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
  try {
    // Get the current attachment to verify it exists
    const current = await getAttachmentByIdFromDb(id, tenantId);
    if (!current.success || !current.data) {
      return {
        success: false,
        error: current.error || 'Attachment not found'
      };
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.url !== undefined) {
      updateData.url = updates.url;
    }

    if (updates.type !== undefined) {
      updateData.type = updates.type;
    }

    if (updates.thumbnailUrl !== undefined) {
      updateData.thumbnail_url = updates.thumbnailUrl;
    }

    if (updates.metadata !== undefined) {
      updateData.metadata = updates.metadata;
    }

    // Execute update
    const { data, error } = await supabase
      .from('attachments')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating attachment:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: mapAttachment(data)
    };
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
  try {
    // Verify the attachment exists and belongs to the tenant
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !attachment) {
      return {
        success: false,
        error: 'Attachment not found or you do not have permission to delete it'
      };
    }

    // Delete the attachment
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting attachment:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred when deleting attachment'
    };
  }
}