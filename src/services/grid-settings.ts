// This file is for server-side operations only
import { getDb } from './db.server';

export type GridState = {
  columnState: string;
  filterState: string;
  sortState: string;
};

type GridSettingsRecord = {
  userId: string;
  gridId: string;
  columnState: string;
  filterState: string;
  sortState: string;
  lastUpdated: string;
};

/**
 * Save grid state to the database
 * @param userId User identifier
 * @param gridId Identifier for the specific grid (e.g., 'requirements-grid')
 * @param state Grid state containing column, filter, and sort information
 */
export async function saveGridState(
  userId: string,
  gridId: string,
  state: GridState
) {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if record already exists
  const existingRecord = db
    .prepare('SELECT * FROM grid_settings WHERE userId = ? AND gridId = ?')
    .get(userId, gridId) as GridSettingsRecord | undefined;

  if (existingRecord) {
    // Update existing record
    db.prepare(
      `UPDATE grid_settings 
       SET columnState = ?, filterState = ?, sortState = ?, lastUpdated = ? 
       WHERE userId = ? AND gridId = ?`
    ).run(
      state.columnState,
      state.filterState,
      state.sortState,
      now,
      userId,
      gridId
    );
  } else {
    // Insert new record
    db.prepare(
      `INSERT INTO grid_settings (userId, gridId, columnState, filterState, sortState, lastUpdated) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      gridId,
      state.columnState,
      state.filterState,
      state.sortState,
      now
    );
  }

  return { success: true };
}

/**
 * Load grid state from the database
 * @param userId User identifier
 * @param gridId Identifier for the specific grid
 */
export async function loadGridState(userId: string, gridId: string) {
  const db = getDb();
  
  const record = db
    .prepare('SELECT * FROM grid_settings WHERE userId = ? AND gridId = ?')
    .get(userId, gridId) as GridSettingsRecord | undefined;

  if (!record) {
    return null;
  }

  return {
    columnState: record.columnState,
    filterState: record.filterState,
    sortState: record.sortState,
    lastUpdated: record.lastUpdated
  };
}

/**
 * Delete grid state from the database
 * @param userId User identifier
 * @param gridId Identifier for the specific grid
 */
export async function deleteGridState(userId: string, gridId: string) {
  const db = getDb();
  
  db.prepare('DELETE FROM grid_settings WHERE userId = ? AND gridId = ?')
    .run(userId, gridId);

  return { success: true };
} 