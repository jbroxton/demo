/**
 * @file src/services/tabs-db.ts
 * @description Database service for managing tabs in Supabase. Handles tab CRUD operations and active state management.
 * @module tabs-db
 * @see {@link Tab} - Tab type definition
 * @see {@link mapTab} - Internal mapper for DB rows to Tab type
 * @example
 * // Get all tabs
 * const result = await getTabsFromDb();
 * if (result.success) {
 *   console.log(result.data.tabs, result.data.activeTabId);
 * }
 * @returns All functions return { success: boolean, data?: any, error?: string }
 * @constants
 * - mapTab: Maps database rows to Tab type with camelCase properties
 * @imports
 * - supabase: Database client
 * - Tab: Type definition from models
 * @functions
 * - getTabsFromDb(): Returns all tabs with active tab ID
 * - createTabInDb(tab): Creates new tab or activates existing
 * - deleteTabFromDb(tabId): Removes tab and manages active state
 * - activateTabInDb(tabId): Sets specified tab as active
 * - updateTabTitleForItemInDb(itemId, type, newTitle): Updates title for matching tabs
 * - updateTabInDb(tabId, newTabProps): Updates tab properties
 * - updateNewTabToSavedItemInDb(tempId, itemId, name, type): Converts temp to saved
 * @exports
 * - getTabsFromDb(): Fetch all tabs and active tab ID
 * - createTabInDb(): Create new tab or activate existing
 * - deleteTabFromDb(): Delete tab and handle active state
 * - activateTabInDb(): Set tab as active
 * - updateTabTitleForItemInDb(): Update title for tabs matching item
 * - updateTabInDb(): Update specific tab properties
 * - updateNewTabToSavedItemInDb(): Convert temporary tab to saved item
 */

import { supabase } from './supabase';
import { Tab } from '@/types/models';

// Map database rows to Tab type
const mapTab = (row: any): Tab => ({
  id: row.id,
  title: row.title,
  type: row.type,
  itemId: row.item_id,
  hasChanges: row.has_changes || false
});

/**
 * Get all tabs from the database
 */
export async function getTabsFromDb(tenantId: string, userId?: string) {
  try {
    console.log('getTabsFromDb - tenantId:', tenantId, 'userId:', userId);
    
    // Build query
    let query = supabase
      .from('tabs')
      .select('*')
      .eq('tenant_id', tenantId);
    
    // Add user filter if userId is provided
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Fetch all tabs ordered by creation time
    const { data: tabs, error } = await query.order('created_at', { ascending: true });
    
    console.log('getTabsFromDb - found tabs:', tabs?.length || 0);

    if (error) {
      throw error;
    }

    // Convert to the expected format
    const formattedTabs = (tabs || []).map(mapTab);
    
    // Also get the active tab ID - make sure we only have one active tab
    const activeTabs = tabs?.filter(tab => tab.is_active) || [];
    
    console.log('getTabsFromDb - tabs with is_active:', tabs?.map(t => ({ id: t.id, title: t.title, is_active: t.is_active })));
    console.log('getTabsFromDb - active tabs count:', activeTabs.length);
    
    if (activeTabs.length > 1) {
      console.error('WARNING: Multiple active tabs found!', activeTabs.map(t => ({ id: t.id, title: t.title })));
    }
    
    const activeTab = activeTabs[0] || null;
    const activeTabId = activeTab?.id || null;
    
    console.log('getTabsFromDb - activeTab:', activeTab);
    console.log('getTabsFromDb - activeTabId:', activeTabId);
    
    return { 
      success: true, 
      data: { 
        tabs: formattedTabs, 
        activeTabId 
      }
    };
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new tab
 */
export async function createTabInDb(tab: Omit<Tab, 'id' | 'tenantId'>, tenantId: string, userId: string) {
  try {
    console.log('createTabInDb - params:', { tab, tenantId, userId });
    
    // Check if tab with the same itemId and type already exists
    const { data: existingTab, error: checkError } = await supabase
      .from('tabs')
      .select('*')
      .eq('item_id', tab.itemId)
      .eq('type', tab.type)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();
    
    if (existingTab && !checkError) {
      console.log('Found existing tab:', existingTab.id, existingTab.title);
      
      // If it exists, mark it as active
      await supabase
        .from('tabs')
        .update({ is_active: false })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .neq('id', existingTab.id);
      
      await supabase
        .from('tabs')
        .update({ is_active: true })
        .eq('id', existingTab.id)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId);
      
      console.log('Activated existing tab:', existingTab.id);
      
      return { 
        success: true, 
        data: { 
          tab: mapTab(existingTab),
          isExisting: true
        }
      };
    }
    
    console.log('Creating new tab for:', tab.type, tab.title);
    
    // Mark all tabs as inactive first
    const { error: deactivateError } = await supabase
      .from('tabs')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .neq('id', '');
    
    if (deactivateError) {
      console.error('Error deactivating tabs:', deactivateError);
    }
    
    // Insert the new tab
    const { data: newTab, error } = await supabase
      .from('tabs')
      .insert({
        title: tab.title,
        type: tab.type,
        item_id: tab.itemId,
        is_active: true,
        tenant_id: tenantId,
        user_id: userId,
        has_changes: tab.hasChanges || false
      })
      .select()
      .single();
    
    console.log('New tab created:', newTab?.id, newTab?.title, 'is_active:', newTab?.is_active);

    if (error) {
      throw error;
    }
    
    // Return the created tab
    return { 
      success: true, 
      data: {
        tab: mapTab(newTab),
        isExisting: false
      }
    };
  } catch (error) {
    console.error('Error creating tab:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Close/delete a tab
 */
export async function deleteTabFromDb(tabId: string, tenantId: string, userId: string) {
  try {
    // Check if the tab is active
    const { data: tabToClose, error: checkError } = await supabase
      .from('tabs')
      .select('is_active')
      .eq('id', tabId)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();
    
    if (checkError || !tabToClose) {
      return { success: false, error: 'Tab not found' };
    }
    
    // Delete the tab
    const { error: deleteError } = await supabase
      .from('tabs')
      .delete()
      .eq('id', tabId)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }
    
    // If the closed tab was active, activate another tab
    if (tabToClose.is_active) {
      // Get the last tab (ordered by created_at)
      const { data: remainingTabs, error: tabsError } = await supabase
        .from('tabs')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (remainingTabs && remainingTabs.length > 0) {
        // Activate the last tab
        await supabase
          .from('tabs')
          .update({ is_active: true })
          .eq('id', remainingTabs[0].id)
          .eq('tenant_id', tenantId)
          .eq('user_id', userId);
        
        return { success: true, data: { newActiveTabId: remainingTabs[0].id } };
      } else {
        // No tabs left
        return { success: true, data: { newActiveTabId: null } };
      }
    } else {
      // The closed tab wasn't active, so the active tab remains the same
      const { data: activeTab, error: activeError } = await supabase
        .from('tabs')
        .select('id')
        .eq('is_active', true)
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .single();
      
      return { success: true, data: { newActiveTabId: activeTab?.id || null } };
    }
  } catch (error) {
    console.error('Error deleting tab:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Activate a tab
 */
export async function activateTabInDb(tabId: string, tenantId: string, userId: string) {
  console.log('activateTabInDb - tabId:', tabId, 'tenantId:', tenantId, 'userId:', userId);
  
  try {
    // Check if the tab exists
    const { data: tab, error: checkError } = await supabase
      .from('tabs')
      .select('id')
      .eq('id', tabId)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single();
    
    console.log('activateTabInDb - tab check result:', tab, 'error:', checkError);
    
    if (checkError || !tab) {
      console.error('activateTabInDb - tab not found');
      return { success: false, error: 'Tab not found' };
    }
    
    // Use RPC function for atomic update if available, otherwise do sequential updates
    // First deactivate all tabs for this user
    const { error: deactivateError } = await supabase
      .from('tabs')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);
    
    if (deactivateError) {
      console.error('activateTabInDb - deactivate error:', deactivateError);
      throw deactivateError;
    }
    
    // Then activate the specific tab
    const { data: activatedTab, error: activateError } = await supabase
      .from('tabs')
      .update({ is_active: true })
      .eq('id', tabId)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .select()
      .single();

    if (activateError) {
      console.error('activateTabInDb - activate error:', activateError);
      throw activateError;
    }
    
    console.log('activateTabInDb - activated tab:', activatedTab);
    return { success: true };
  } catch (error) {
    console.error(`Error activating tab ${tabId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update tab title
 */
export async function updateTabTitleForItemInDb(itemId: string, type: Tab['type'], newTitle: string, tenantId: string) {
  try {
    // Update all tabs that match the itemId and type
    const { error } = await supabase
      .from('tabs')
      .update({ title: newTitle })
      .eq('item_id', itemId)
      .eq('type', type)
      .eq('tenant_id', tenantId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating tab titles for item ${itemId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update a specific tab
 */
export async function updateTabInDb(tabId: string, newTabProps: Partial<Tab>, tenantId: string) {
  try {
    // Build the update object
    const updateData: any = {};
    
    if (newTabProps.title !== undefined) {
      updateData.title = newTabProps.title;
    }
    
    if (newTabProps.type !== undefined) {
      updateData.type = newTabProps.type;
    }
    
    if (newTabProps.itemId !== undefined) {
      updateData.item_id = newTabProps.itemId;
    }
    
    if (newTabProps.hasChanges !== undefined) {
      updateData.has_changes = newTabProps.hasChanges;
    }
    
    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No properties to update' };
    }
    
    // Update the tab
    const { error } = await supabase
      .from('tabs')
      .update(updateData)
      .eq('id', tabId)
      .eq('tenant_id', tenantId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error updating tab ${tabId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update a temporary "new" tab to a persistent one
 */
export async function updateNewTabToSavedItemInDb(temporaryTabId: string, newItemId: string, newItemName: string, type: Tab['type'], tenantId: string, userId: string) {
  try {
    // Check if the temporary tab exists
    const { data: tempTab, error: checkError } = await supabase
      .from('tabs')
      .select('*')
      .eq('id', temporaryTabId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (checkError || !tempTab) {
      return { success: false, error: 'Temporary tab not found' };
    }
    
    // Delete the temporary tab
    const { error: deleteError } = await supabase
      .from('tabs')
      .delete()
      .eq('id', temporaryTabId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      throw deleteError;
    }
    
    // Create a new tab
    const { data: newTab, error: createError } = await supabase
      .from('tabs')
      .insert({
        title: newItemName,
        type: type,
        item_id: newItemId,
        is_active: true,
        tenant_id: tenantId,
        user_id: userId,
        has_changes: false  // New tabs start with no changes
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }
    
    // Mark all other tabs as inactive
    await supabase
      .from('tabs')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .neq('id', newTab.id);
    
    return { success: true, data: { newTabId: newTab.id } };
  } catch (error) {
    console.error('Error updating new tab to saved item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}