// Service for managing tabs in the database
import { getDb } from './db.server';
import { Tab } from '@/types/models';

// Generate a simple ID - matching the same method used in the Zustand store
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Initialize the tabs table with the correct schema
 */
function initTabsTable(db: any) {
  // First drop the table if it exists to avoid schema mismatches
  db.prepare(`
    DROP TABLE IF EXISTS tabs
  `).run();
  
  // Create the table with the current schema
  db.prepare(`
    CREATE TABLE tabs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      itemId TEXT NOT NULL,
      isActive INTEGER DEFAULT 0
    )
  `).run();
  
  console.log("Tabs table initialized with current schema");
}

/**
 * Get all tabs from the database
 */
export async function getTabsFromDb() {
  const db = getDb();
  
  try {
    // Check if the tabs table exists
    const tabsTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='tabs'
    `).get();
    
    // Create the table if it doesn't exist
    if (!tabsTableExists) {
      initTabsTable(db);
      return { success: true, data: { tabs: [], activeTabId: null } };
    }
    
    // Check if the isActive column exists
    try {
      // This will throw an error if isActive doesn't exist
      db.prepare('SELECT isActive FROM tabs LIMIT 1').get();
    } catch (error) {
      console.warn("isActive column not found, recreating tabs table with correct schema");
      initTabsTable(db);
      return { success: true, data: { tabs: [], activeTabId: null } };
    }
    
    // Fetch all tabs
    const tabs = db.prepare('SELECT * FROM tabs').all() as (Tab & { isActive: number })[];
    
    // Convert to the expected format
    const formattedTabs = tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      type: tab.type,
      itemId: tab.itemId
    }));
    
    // Also get the active tab ID
    const activeTab = tabs.find(tab => tab.isActive === 1);
    const activeTabId = activeTab?.id || null;
    
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
export async function createTabInDb(tab: Omit<Tab, 'id'>) {
  const db = getDb();
  const id = generateId();
  
  try {
    // Check if the tabs table exists and create it if not
    const tabsTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='tabs'
    `).get();
    
    if (!tabsTableExists) {
      initTabsTable(db);
    } else {
      // Check if the isActive column exists
      try {
        // This will throw an error if isActive doesn't exist
        db.prepare('SELECT isActive FROM tabs LIMIT 1').get();
      } catch (error) {
        console.warn("isActive column not found, recreating tabs table with correct schema");
        initTabsTable(db);
      }
    }
    
    // Check if tab with the same itemId and type already exists
    const existingTab = db.prepare(
      'SELECT * FROM tabs WHERE itemId = ? AND type = ?'
    ).get(tab.itemId, tab.type) as (Tab & { isActive: number }) | undefined;
    
    if (existingTab) {
      // If it exists, mark it as active
      db.prepare('UPDATE tabs SET isActive = 0').run();
      db.prepare('UPDATE tabs SET isActive = 1 WHERE id = ?').run(existingTab.id);
      
      return { 
        success: true, 
        data: { 
          tab: {
            id: existingTab.id,
            title: existingTab.title,
            type: existingTab.type as Tab['type'],
            itemId: existingTab.itemId
          },
          isExisting: true
        }
      };
    }
    
    // Mark all tabs as inactive first
    db.prepare('UPDATE tabs SET isActive = 0').run();
    
    // Insert the new tab
    db.prepare(`
      INSERT INTO tabs (id, title, type, itemId, isActive)
      VALUES (?, ?, ?, ?, 1)
    `).run(id, tab.title, tab.type, tab.itemId);
    
    // Return the created tab
    return { 
      success: true, 
      data: {
        tab: {
          ...tab,
          id
        },
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
export async function deleteTabFromDb(tabId: string) {
  const db = getDb();
  
  try {
    // Check if the tab is active
    const tabToClose = db.prepare('SELECT isActive FROM tabs WHERE id = ?').get(tabId) as { isActive: number } | undefined;
    
    if (!tabToClose) {
      return { success: false, error: 'Tab not found' };
    }
    
    // Delete the tab
    db.prepare('DELETE FROM tabs WHERE id = ?').run(tabId);
    
    // If the closed tab was active, activate another tab
    if (tabToClose.isActive === 1) {
      // Get the last tab
      const lastTab = db.prepare('SELECT id FROM tabs ORDER BY rowid DESC LIMIT 1').get() as { id: string } | undefined;
      
      if (lastTab) {
        // Activate the last tab
        db.prepare('UPDATE tabs SET isActive = 1 WHERE id = ?').run(lastTab.id);
        return { success: true, data: { newActiveTabId: lastTab.id } };
      } else {
        // No tabs left
        return { success: true, data: { newActiveTabId: null } };
      }
    } else {
      // The closed tab wasn't active, so the active tab remains the same
      const activeTab = db.prepare('SELECT id FROM tabs WHERE isActive = 1').get() as { id: string } | undefined;
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
export async function activateTabInDb(tabId: string) {
  const db = getDb();
  
  try {
    // Check if the tab exists
    const tab = db.prepare('SELECT id FROM tabs WHERE id = ?').get(tabId);
    
    if (!tab) {
      return { success: false, error: 'Tab not found' };
    }
    
    // Mark all tabs as inactive first
    db.prepare('UPDATE tabs SET isActive = 0').run();
    
    // Activate the specified tab
    db.prepare('UPDATE tabs SET isActive = 1 WHERE id = ?').run(tabId);
    
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
export async function updateTabTitleForItemInDb(itemId: string, type: Tab['type'], newTitle: string) {
  const db = getDb();
  
  try {
    // Update all tabs that match the itemId and type
    const result = db.prepare('UPDATE tabs SET title = ? WHERE itemId = ? AND type = ?')
      .run(newTitle, itemId, type);
    
    if (result.changes === 0) {
      return { success: false, error: 'No matching tabs found' };
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
export async function updateTabInDb(tabId: string, newTabProps: Partial<Tab>) {
  const db = getDb();
  
  try {
    // Build the SET clause dynamically based on the provided properties
    const setClauses = [];
    const params = [];
    
    if (newTabProps.title !== undefined) {
      setClauses.push('title = ?');
      params.push(newTabProps.title);
    }
    
    if (newTabProps.type !== undefined) {
      setClauses.push('type = ?');
      params.push(newTabProps.type);
    }
    
    if (newTabProps.itemId !== undefined) {
      setClauses.push('itemId = ?');
      params.push(newTabProps.itemId);
    }
    
    if (setClauses.length === 0) {
      return { success: false, error: 'No properties to update' };
    }
    
    // Add the tabId to the params
    params.push(tabId);
    
    // Update the tab
    const result = db.prepare(`UPDATE tabs SET ${setClauses.join(', ')} WHERE id = ?`)
      .run(...params);
    
    if (result.changes === 0) {
      return { success: false, error: 'Tab not found' };
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
export async function updateNewTabToSavedItemInDb(temporaryTabId: string, newItemId: string, newItemName: string, type: Tab['type']) {
  const db = getDb();
  
  try {
    // Start a transaction
    db.prepare('BEGIN').run();
    
    // Check if the temporary tab exists
    const tempTab = db.prepare('SELECT * FROM tabs WHERE id = ?').get(temporaryTabId);
    
    if (!tempTab) {
      db.prepare('ROLLBACK').run();
      return { success: false, error: 'Temporary tab not found' };
    }
    
    // Delete the temporary tab
    db.prepare('DELETE FROM tabs WHERE id = ?').run(temporaryTabId);
    
    // Create a new tab
    const newTabId = generateId();
    
    db.prepare(`
      INSERT INTO tabs (id, title, type, itemId, isActive)
      VALUES (?, ?, ?, ?, 1)
    `).run(newTabId, newItemName, type, newItemId);
    
    // Mark all other tabs as inactive
    db.prepare('UPDATE tabs SET isActive = 0 WHERE id != ?').run(newTabId);
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    
    return { success: true, data: { newTabId } };
  } catch (error) {
    // Rollback in case of error
    try {
      db.prepare('ROLLBACK').run();
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    console.error('Error updating new tab to saved item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}