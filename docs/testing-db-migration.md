# Testing the Database Migration

This document provides guidance on testing the migration from Zustand (client-side storage) to React Query with SQLite (database-backed storage).

## Implementation Toggle

A runtime toggle has been added to facilitate testing both implementations. This allows for direct comparison of the Zustand and React Query implementations without needing to modify code.

### Using the Toggle

1. Look for the toggle switch in the bottom-right corner of the dashboard.
2. The toggle will display one of two states:
   - "Client Storage (Zustand)" - The original implementation using Zustand stores and localStorage
   - "Database Storage (React Query)" - The new implementation using React Query and SQLite

3. Click the toggle to switch between implementations.

## Testing Approach

### Phase 1: Parallel Testing

During this phase, both implementations exist side-by-side, allowing you to validate that the database-backed implementation behaves correctly.

1. **Create Test Data in Zustand**
   - Switch to "Client Storage (Zustand)"
   - Create test products, interfaces, features, releases, and requirements
   - Verify that everything works as expected

2. **Test Database Storage**
   - Switch to "Database Storage (React Query)"
   - Validate that you can perform the same operations:
     - Create new products, interfaces, features, releases, and requirements
     - Edit existing items
     - Delete items
     - Navigate between items

3. **Verify UI Behavior**
   - Test that component loading states appear correctly
   - Verify that error handling works as expected
   - Check that mutations (create/update/delete) reflect in the UI

### Phase 2: Edge Case Testing

Test specific edge cases that might differ between implementations:

1. **Concurrent Edits**
   - Open multiple tabs with the same item
   - Make edits in both tabs
   - Verify that changes are properly synchronized

2. **Error Recovery**
   - Test recovery from network errors
   - Verify proper error messaging for database errors

3. **Empty State Handling**
   - Verify behavior when there's no data
   - Test creating first items in each category

## Known Differences Between Implementations

1. **Loading States**
   - React Query shows loading spinners during data fetching
   - Zustand shows data immediately (from memory)

2. **Error Handling**
   - React Query has more robust error handling
   - Zustand may not show all error states

3. **Data Freshness**
   - React Query fetches fresh data from the database
   - Zustand uses cached data from localStorage

## Complete Migration

Once testing is complete and the React Query implementation is verified to be working correctly:

1. Remove the Zustand stores
2. Remove the hybrid storage utility
3. Remove the parallel component implementations
4. Remove the implementation toggle
5. Use only the React Query implementation

## Reporting Issues

If you encounter issues during testing, please document them with:

1. Which implementation was active
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Any error messages (check browser console)

Submit issues through the team's regular issue tracking process.