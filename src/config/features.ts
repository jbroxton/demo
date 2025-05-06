// Feature flags to control application behavior

/**
 * Controls whether to migrate data from localStorage to database on application startup
 * Only relevant when database storage is selected via the toggle
 */
export const AUTO_MIGRATE_DATA = true;

/**
 * Controls development mode features
 */
export const ENABLE_DEVELOPMENT_TOOLS = process.env.NODE_ENV === 'development';

/**
 * Controls whether to show the implementation toggle UI elements
 * Set to false as we've fully migrated to database-backed storage
 * and no longer need to switch between implementations
 */
export const SHOW_IMPLEMENTATION_CONTROLS = false;

/**
 * Whether to use DB-backed storage
 * Always true as we've fully migrated to database-driven architecture
 */
export const USE_DB_BACKED_STORAGE = true;