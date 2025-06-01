// Pages database service following Notion's architecture with JSONB block storage
// Handles CRUD operations for the unified page model using Supabase

import { Page, PageType, AnyPropertyValue, validatePageProperties } from '@/types/models/Page';
import { Block, BlockType } from '@/types/models/Block';
// Service result type for consistent API responses
type ServiceResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};
import { supabase } from './supabase';
import { generateUuid } from '@/utils/uuid-utils';

// Helper to convert database row to Page object
function mapDbRowToPage(row: any): Page {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    parent_id: row.parent_id || null,
    tenant_id: row.tenant_id,
    properties: row.properties || {},
    blocks: row.blocks || [],
    block_count: row.block_count || 0,
    last_block_update: row.last_block_update,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by || null,
    last_edited_by: row.last_edited_by || null,
  };
}

// Create a new page
export async function createPage(pageData: {
  type: PageType;
  title: string;
  parent_id?: string;
  tenant_id: string;
  properties?: Record<string, AnyPropertyValue>;
  blocks?: Block[];
  created_by?: string;
}): Promise<ServiceResult<Page>> {
  try {
    
    // Validate properties against page type schema
    if (pageData.properties && !validatePageProperties(pageData.type, pageData.properties)) {
      return {
        success: false,
        error: `Invalid properties for page type ${pageData.type}`,
      };
    }

    // Validate parent exists if provided
    if (pageData.parent_id) {
      const { data: parentPage, error: parentError } = await supabase
        .from('pages')
        .select('id')
        .eq('id', pageData.parent_id)
        .eq('tenant_id', pageData.tenant_id)
        .single();

      if (parentError || !parentPage) {
        return {
          success: false,
          error: 'Parent page does not exist',
        };
      }
    }

    // Create page with blocks - database will handle IDs and timestamps via triggers
    const pageToInsert = {
      type: pageData.type,
      title: pageData.title,
      parent_id: pageData.parent_id || null,
      tenant_id: pageData.tenant_id,
      properties: pageData.properties || {},
      blocks: pageData.blocks || [],
      created_by: pageData.created_by,
      last_edited_by: pageData.created_by,
    };

    const { data, error } = await supabase
      .from('pages')
      .insert([pageToInsert])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating page:', error);
      return {
        success: false,
        error: `Failed to create page: ${error.message}`,
      };
    }

    return {
      success: true,
      data: mapDbRowToPage(data),
    };
  } catch (error) {
    console.error('Error creating page:', error);
    return {
      success: false,
      error: `Failed to create page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Get a page by ID
export async function getPageById(id: string, tenantId: string): Promise<ServiceResult<Page>> {
  try {
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Page not found',
        };
      }
      return {
        success: false,
        error: `Failed to get page: ${error.message}`,
      };
    }
    
    return {
      success: true,
      data: mapDbRowToPage(data),
    };
  } catch (error) {
    console.error('Error getting page:', error);
    return {
      success: false,
      error: `Failed to get page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Get pages with filtering options
export async function getPages(options: {
  tenantId: string;
  type?: PageType;
  parentId?: string | null;
  limit?: number;
  offset?: number;
}): Promise<ServiceResult<Page[]>> {
  try {
    
    let query = supabase
      .from('pages')
      .select('*')
      .eq('tenant_id', options.tenantId);
    
    // Add type filter
    if (options.type) {
      query = query.eq('type', options.type);
    }
    
    // Add parent filter (including null for root pages)
    if (options.parentId !== undefined) {
      if (options.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', options.parentId);
      }
    }
    
    // Add ordering and pagination
    query = query.order('updated_at', { ascending: false });
    
    if (options.limit) {
      query = query.limit(options.limit);
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      return {
        success: false,
        error: `Failed to get pages: ${error.message}`,
      };
    }
    
    const pages = (data || []).map(mapDbRowToPage);
    
    return {
      success: true,
      data: pages,
    };
  } catch (error) {
    console.error('Error getting pages:', error);
    return {
      success: false,
      error: `Failed to get pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Update a page
export async function updatePage(
  id: string,
  updates: {
    title?: string;
    type?: PageType;
    parent_id?: string | null;
    properties?: Record<string, AnyPropertyValue>;
    blocks?: Block[];
    last_edited_by?: string;
  },
  tenantId: string
): Promise<ServiceResult<Page>> {
  try {
    
    // First check if page exists and get current data
    const currentPageResult = await getPageById(id, tenantId);
    if (!currentPageResult.success) {
      return currentPageResult;
    }
    
    const currentPage = currentPageResult.data;
    
    // Validate properties if provided
    const targetType = updates.type || currentPage.type;
    if (updates.properties && !validatePageProperties(targetType, updates.properties)) {
      return {
        success: false,
        error: `Invalid properties for page type ${targetType}`,
      };
    }

    // Validate parent exists if being changed
    if (updates.parent_id !== undefined && updates.parent_id !== null) {
      const { data: parentPage, error: parentError } = await supabase
        .from('pages')
        .select('id')
        .eq('id', updates.parent_id)
        .eq('tenant_id', tenantId)
        .single();

      if (parentError || !parentPage) {
        return {
          success: false,
          error: 'Parent page does not exist',
        };
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    
    if (updates.type !== undefined) {
      updateData.type = updates.type;
    }
    
    if (updates.parent_id !== undefined) {
      updateData.parent_id = updates.parent_id;
    }
    
    if (updates.properties !== undefined) {
      // Merge with existing properties
      updateData.properties = {
        ...currentPage.properties,
        ...updates.properties,
      };
    }
    
    if (updates.blocks !== undefined) {
      updateData.blocks = updates.blocks;
      updateData.block_count = updates.blocks.length;
      updateData.last_block_update = new Date().toISOString();
    }
    
    if (updates.last_edited_by !== undefined) {
      updateData.last_edited_by = updates.last_edited_by;
    }
    
    const { data, error } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: `Failed to update page: ${error.message}`,
      };
    }
    
    return {
      success: true,
      data: mapDbRowToPage(data),
    };
    
  } catch (error) {
    console.error('Error updating page:', error);
    return {
      success: false,
      error: `Failed to update page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Delete a page
export async function deletePage(id: string, tenantId: string): Promise<ServiceResult<boolean>> {
  try {
    
    // Check if page exists
    const pageResult = await getPageById(id, tenantId);
    if (!pageResult.success) {
      return {
        success: false,
        error: 'Page not found',
      };
    }
    
    const page = pageResult.data;
    
    // Check for child pages
    const { data: childPages, error: childError } = await supabase
      .from('pages')
      .select('id')
      .eq('parent_id', id)
      .eq('tenant_id', tenantId);

    if (childError) {
      return {
        success: false,
        error: `Failed to check child pages: ${childError.message}`,
      };
    }

    if (childPages && childPages.length > 0) {
      return {
        success: false,
        error: `Cannot delete page with ${childPages.length} child page(s). Delete children first or move them to another parent.`,
      };
    }
    
    // Clean up assignments before deleting (for roadmaps and releases)
    if (page.type === 'roadmap' || page.type === 'release') {
      await cleanupAssignmentsForDeletedPage(id, page.type, tenantId);
    }
    
    // Delete the page (blocks are stored within the page, so they're deleted automatically)
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) {
      return {
        success: false,
        error: `Failed to delete page: ${error.message}`,
      };
    }
    
    console.log(`Deleted page ${id}`);
    
    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('Error deleting page:', error);
    return {
      success: false,
      error: `Failed to delete page: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Helper function to clean up assignments when a roadmap or release is deleted
async function cleanupAssignmentsForDeletedPage(
  deletedPageId: string, 
  pageType: 'roadmap' | 'release', 
  tenantId: string
): Promise<void> {
  try {
    console.log(`Cleaning up ${pageType} assignments for deleted page ${deletedPageId}`);
    
    const assignmentType = pageType === 'roadmap' ? 'roadmaps' : 'releases';
    
    // Find all pages that have this roadmap/release assigned
    const { data: pagesWithAssignments, error } = await supabase
      .from('pages')
      .select('id, properties')
      .eq('tenant_id', tenantId)
      .not('properties', 'is', null);
    
    if (error) {
      console.error('Error finding pages with assignments:', error);
      return;
    }
    
    if (!pagesWithAssignments) return;
    
    // Process pages that need assignment cleanup
    const pagesToUpdate = pagesWithAssignments.filter(page => {
      const assignedTo = page.properties?.assignedTo;
      return assignedTo && 
             assignedTo[assignmentType] && 
             Array.isArray(assignedTo[assignmentType]) &&
             assignedTo[assignmentType].some((item: any) => item.id === deletedPageId);
    });
    
    console.log(`Found ${pagesToUpdate.length} pages with assignments to clean up`);
    
    // Update each page to remove the deleted assignment
    for (const page of pagesToUpdate) {
      const updatedAssignments = {
        ...page.properties.assignedTo,
        [assignmentType]: page.properties.assignedTo[assignmentType].filter(
          (item: any) => item.id !== deletedPageId
        )
      };
      
      const updatedProperties = {
        ...page.properties,
        assignedTo: updatedAssignments
      };
      
      await supabase
        .from('pages')
        .update({ 
          properties: updatedProperties,
          updated_at: new Date().toISOString()
        })
        .eq('id', page.id)
        .eq('tenant_id', tenantId);
        
      console.log(`Cleaned up assignments for page ${page.id}`);
    }
    
  } catch (error) {
    console.error('Error cleaning up assignments:', error);
  }
}

// Block operations for JSON storage

// Add a block to a page
export async function addBlockToPage(
  pageId: string,
  block: Omit<Block, 'id' | 'created_at' | 'updated_at'>,
  tenantId: string,
  position?: number
): Promise<ServiceResult<Block>> {
  try {
    
    // Get current page
    const pageResult = await getPageById(pageId, tenantId);
    if (!pageResult.success) {
      return {
        success: false,
        error: 'Page not found',
      };
    }
    
    const page = pageResult.data;
    const currentBlocks = page.blocks || [];
    
    // Create new block - add ID and timestamps
    const newBlock: Block = {
      ...block,
      id: generateUuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Insert at position or append
    const updatedBlocks = [...currentBlocks];
    if (position !== undefined && position >= 0 && position <= currentBlocks.length) {
      updatedBlocks.splice(position, 0, newBlock);
    } else {
      updatedBlocks.push(newBlock);
    }
    
    // Update page with new blocks
    const updateResult = await updatePage(pageId, { blocks: updatedBlocks }, tenantId);
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error,
      };
    }
    
    // Get the updated page to return the actual block with database-generated metadata
    const updatedPageResult = await getPageById(pageId, tenantId);
    if (!updatedPageResult.success) {
      return {
        success: false,
        error: 'Failed to retrieve updated page',
      };
    }
    
    // Find the newly added block (it will be the last one or at the specified position)
    const updatedPage = updatedPageResult.data;
    const addedBlock = position !== undefined 
      ? updatedPage.blocks[position]
      : updatedPage.blocks[updatedPage.blocks.length - 1];
    
    return {
      success: true,
      data: addedBlock,
    };
  } catch (error) {
    console.error('Error adding block to page:', error);
    return {
      success: false,
      error: `Failed to add block: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Update a block in a page
export async function updateBlockInPage(
  pageId: string,
  blockId: string,
  updates: Partial<Omit<Block, 'id' | 'created_at'>>,
  tenantId: string
): Promise<ServiceResult<Block>> {
  try {
    const pageResult = await getPageById(pageId, tenantId);
    if (!pageResult.success) {
      return {
        success: false,
        error: 'Page not found',
      };
    }
    
    const page = pageResult.data;
    const currentBlocks = page.blocks || [];
    
    // Find and update the block
    const blockIndex = currentBlocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      return {
        success: false,
        error: 'Block not found',
      };
    }
    
    const updatedBlock: Block = {
      ...currentBlocks[blockIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    const updatedBlocks = [...currentBlocks];
    updatedBlocks[blockIndex] = updatedBlock;
    
    // Update page with modified blocks
    const updateResult = await updatePage(pageId, { blocks: updatedBlocks }, tenantId);
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error,
      };
    }
    
    return {
      success: true,
      data: updatedBlock,
    };
  } catch (error) {
    console.error('Error updating block:', error);
    return {
      success: false,
      error: `Failed to update block: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Delete a block from a page
export async function deleteBlockFromPage(
  pageId: string,
  blockId: string,
  tenantId: string
): Promise<ServiceResult<boolean>> {
  try {
    const pageResult = await getPageById(pageId, tenantId);
    if (!pageResult.success) {
      return {
        success: false,
        error: 'Page not found',
      };
    }
    
    const page = pageResult.data;
    const currentBlocks = page.blocks || [];
    
    // Filter out the block to delete
    const updatedBlocks = currentBlocks.filter(b => b.id !== blockId);
    
    if (updatedBlocks.length === currentBlocks.length) {
      return {
        success: false,
        error: 'Block not found',
      };
    }
    
    // Update page with filtered blocks
    const updateResult = await updatePage(pageId, { blocks: updatedBlocks }, tenantId);
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error,
      };
    }
    
    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('Error deleting block:', error);
    return {
      success: false,
      error: `Failed to delete block: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Get page hierarchy (children of a page)
export async function getPageHierarchy(
  parentId: string | null,
  tenantId: string,
  maxDepth: number = 5
): Promise<ServiceResult<Page[]>> {
  try {
    
    // For now, we'll implement a simple non-recursive approach
    // Supabase doesn't support recursive CTEs directly, so we'll fetch level by level
    const result: Page[] = [];
    let currentLevelIds = parentId ? [parentId] : [null];
    let depth = 0;
    
    while (currentLevelIds.length > 0 && depth < maxDepth) {
      let query = supabase
        .from('pages')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (currentLevelIds[0] === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.in('parent_id', currentLevelIds.filter(id => id !== null));
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) {
        return {
          success: false,
          error: `Failed to get page hierarchy: ${error.message}`,
        };
      }
      
      if (!data || data.length === 0) {
        break;
      }
      
      const pages = data.map(mapDbRowToPage);
      result.push(...pages);
      
      // Prepare for next level
      currentLevelIds = pages.map(p => p.id);
      depth++;
    }
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error getting page hierarchy:', error);
    return {
      success: false,
      error: `Failed to get page hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Search pages by title and content
export async function searchPages(
  tenantId: string,
  searchTerm: string,
  options?: {
    type?: PageType;
    limit?: number;
  }
): Promise<ServiceResult<Page[]>> {
  try {
    
    let query = supabase
      .from('pages')
      .select('*')
      .eq('tenant_id', tenantId);
    
    // Use Supabase text search (you may need to enable full-text search extensions)
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,properties::text.ilike.%${searchTerm}%,blocks::text.ilike.%${searchTerm}%`);
    }
    
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    
    query = query.order('updated_at', { ascending: false });
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return {
        success: false,
        error: `Failed to search pages: ${error.message}`,
      };
    }
    
    const pages = (data || []).map(mapDbRowToPage);
    
    return {
      success: true,
      data: pages,
    };
  } catch (error) {
    console.error('Error searching pages:', error);
    return {
      success: false,
      error: `Failed to search pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Get pages by relation property (following Notion's relation queries)
export async function getPagesByRelation(
  tenantId: string,
  relationProperty: string,
  targetPageId: string
): Promise<ServiceResult<Page[]>> {
  try {
    
    // Query for pages that have a relation property pointing to the target page
    // Using JSONB operators for efficient querying
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('tenant_id', tenantId)
      .contains('properties', { [relationProperty]: { relation: [{ id: targetPageId }] } })
      .order('updated_at', { ascending: false });
    
    if (error) {
      return {
        success: false,
        error: `Failed to get pages by relation: ${error.message}`,
      };
    }
    
    const pages = (data || []).map(mapDbRowToPage);
    
    return {
      success: true,
      data: pages,
    };
  } catch (error) {
    console.error('Error getting pages by relation:', error);
    return {
      success: false,
      error: `Failed to get pages by relation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}