# E2E Testing Setup and Guide

This directory contains Playwright E2E tests for the application, specifically testing the pages creation flow from the sidebar navigation.

## Quick Start

```bash
# Install Playwright browsers (one-time setup)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/e2e/pages/pages-creation-flow.spec.ts

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run only on Chromium browser
npm run test:e2e -- --project=chromium

# Debug a specific test
npm run test:e2e:debug tests/e2e/pages/pages-creation-flow.spec.ts
```

## Test Structure

### Pages Creation Flow Tests (`pages/pages-creation-flow.spec.ts`)

Tests the complete page creation workflow:

1. **Create new page from sidebar** - Tests the EntityCreator dialog workflow
2. **Create child pages** - Tests nested page creation with parent context  
3. **Multiple page creation** - Tests repeated creation operations
4. **Dialog cancellation** - Tests user can cancel the creation process
5. **Sidebar interaction states** - Tests expand/collapse and hover effects

## How It Works

### Authentication
- Uses global setup (`tests/global-setup.ts`) to authenticate once for all tests
- Saves auth state to `tests/auth-state.json` for reuse
- Tests use real user credentials: `pm1@test.com` / `password`

### Page Creation Flow
The tests work with your actual EntityCreator component:

1. Click the "+" button in Pages header section
2. EntityCreator dialog opens with "Create New Page" title
3. Click "Create" button (no form to fill - creates directly)
4. Dialog closes and new page appears in sidebar with name "New Feature"
5. Page is clickable and opens a tab in your tab system

### Test Data
- Uses real database with test tenant
- Creates actual pages that persist during test session
- Test cleanup happens automatically between test runs

## Troubleshooting

### Common Issues

**Tests timeout waiting for elements:**
```bash
# Check if app is running on correct port
npm run dev  # Should start on port 3001

# Verify auth setup in global-setup.ts
# Check test user credentials match your database
```

**Dialog not found:**
```bash
# EntityCreator uses shadcn/ui Dialog component
# Ensure your app has all required UI dependencies
```

**Pages not appearing in sidebar:**
```bash
# Check browser console for API errors
# Verify pages-db API route is working
# Check database connectivity
```

### Debug Tips

1. **Run in headed mode** to see what's happening:
   ```bash
   npm run test:e2e:headed
   ```

2. **Use debug mode** to step through tests:
   ```bash
   npm run test:e2e:debug tests/e2e/pages/pages-creation-flow.spec.ts
   ```

3. **Check test artifacts** after failures:
   - Screenshots saved to `test-results/`
   - Videos of test execution available
   - Console logs captured

4. **Inspect page state** during test:
   ```typescript
   await page.pause(); // Add to test code to pause execution
   ```

## Adding New Tests

### Test File Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Your Test Suite', () => {
  test.use({ storageState: 'tests/auth-state.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for necessary elements to load
  });

  test('should do something', async ({ page }) => {
    // Your test steps
  });
});
```

### Key Selectors Used
- `[data-section="pages-header"]` - Pages section header
- `[data-section="pages-tree"]` - Pages sidebar tree
- `[data-entity-type="page"]` - Individual page items
- `[role="dialog"]` - EntityCreator dialogs
- `button[text*="Create"]` - Create buttons

### Best Practices

1. **Use data attributes** for reliable selectors
2. **Wait for elements** before interacting
3. **Use timeouts** for async operations (page creation takes ~300ms)
4. **Test real workflows** not just individual components
5. **Add console logs** for debugging complex flows

## Environment Requirements

- Node.js 18+
- Next.js app running on port 3001
- Supabase database with test data
- Valid test user account in database

## CI/CD Integration

Tests can be run in CI with:

```yaml
- name: Run E2E tests
  run: |
    npm ci
    npx playwright install --with-deps
    npm run test:e2e
```

Note: CI may need different timeouts and should disable headed mode.