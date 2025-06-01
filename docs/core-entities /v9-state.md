# State Management Architecture V9 - DB-Only with Optimistic Updates

Global State - Allow a sync system to keep all components in sync and saved in the db

## Current State

### Architecture Overview
- **React Query**: Primary server state management with manual cache updates and optimistic patterns
- **UnifiedStateProvider**: Legacy wrapper around React Query hooks that aggregates entity queries
- **UIStateProvider**: UI-specific state (sidebars, layout) with localStorage persistence  
- **Mixed Save Patterns**: Auto-save (debounced) + manual save buttons + optimistic updates
- **Provider Hierarchy**: SessionProvider → ThemeProvider → TanstackQueryProvider → AuthProvider → SidebarProvider → UnifiedStateProvider → AgentProvider

### Current Data Flow Issues
- **Multiple Title Sources**: Page titles managed in tabs, page editor, and server state separately
- **Cache Fragmentation**: Manual cache updates followed by invalidation causing over-fetching
- **Local State Leaks**: Editor content exists in component state, localStorage, and TipTap simultaneously
- **Inconsistent Save Behaviors**: Tab editing saves immediately, page content requires manual save
- **Query Configuration**: Some queries use `staleTime: 0, gcTime: 0` disabling React Query caching benefits

### Problems Identified
1. **Dual State Management**: Same data exists in local component state AND React Query cache
2. **Cache Thrashing**: Manual cache updates immediately followed by invalidation
3. **Cross-component Inconsistency**: Different save patterns for same data types (titles)
4. **Memory Leaks**: localStorage backup in page editor without proper cleanup
5. **Over-aggressive Cache Invalidation**: Unnecessary re-fetches from server

### Current Save Mechanisms
- **Page Editor**: Debounced onChange (500ms) → localStorage → manual save button
- **Tab Titles**: Immediate optimistic update → server sync (inconsistent with page content)
- **Sidebar**: Read-only (no editing capabilities)  
- **Entity Names**: Varies by component (some immediate, some debounced)

## Solution

### Core Principle: Single Source of Truth with Optimistic Updates
- **React Query Cache**: Only source of truth for all application data
- **No Local State**: Eliminate component state for server data
- **Optimistic Everything**: All changes reflect immediately in UI across all components
- **Intelligent Debouncing**: Batch related changes efficiently
- **Provider-Centralized**: All updates flow through enhanced UnifiedStateProvider

### Implementation Strategy

#### 1. Enhanced UnifiedStateProvider
- **Centralized Update Router**: Single method for all entity updates across the app
- **Context-Aware Debouncing**: Title changes (immediate + 300ms save), content changes (immediate + 800ms save)
- **Cross-Component Sync**: All UI components see same optimistic state instantly
- **Conflict Resolution**: Handle concurrent edits with timestamp comparison
- **Error Recovery**: Rollback optimistic changes on failure with retry logic

#### 2. Optimistic Update Flow
```
User Change → UnifiedStateProvider.updateEntity()
    ↓
React Query Optimistic Update (immediate UI across all components)
    ↓
Debounced Background Save (300-800ms based on change type)
    ↓
Server Response Updates Cache (reconciliation)
```

#### 3. Component Integration
- **Page Editor**: Remove all local state, use provider for title/content changes
- **Tab Container**: Route all title edits through provider (consistency)
- **Sidebar**: Add inline editing capabilities via provider
- **Context Menus**: Consistent editing patterns across all components

#### 4. Cache Strategy Restoration
- **Restore React Query Defaults**: `staleTime: 5min`, proper garbage collection
- **Optimistic onMutate**: Immediate UI updates for responsiveness
- **Server Reconciliation**: onSuccess updates with server truth
- **Error Rollback**: onError reverts optimistic changes gracefully

#### 5. Debouncing Strategy
- **High Priority**: Title changes (300ms delay) for immediate feedback
- **Normal Priority**: Content/properties (800ms delay) for batching
- **Intelligent Batching**: Group related changes into single API call
- **Smart Coalescing**: Cancel pending saves for same entity when new changes arrive

#### 6. Edge Cases & Error Handling
- **Concurrent Edits**: Detect conflicts via `updated_at` timestamps
- **Network Failures**: Exponential backoff retry (3 attempts max)
- **Stale Data**: Show conflict resolution UI to user
- **Performance**: Limit concurrent saves, queue overflow protection

#### 7. Migration Plan
- **Phase 1**: Enhance UnifiedStateProvider with optimistic update capabilities
- **Phase 2**: Migrate page editor to use provider exclusively (remove local state)
- **Phase 3**: Update tabs and sidebar to use provider for all edits
- **Phase 4**: Remove local state and localStorage dependencies completely
- **Phase 5**: Optimize React Query cache settings and cleanup debug code

### Expected Benefits
- **Consistent UX**: All edits behave the same way app-wide (no more mixed patterns)
- **Better Performance**: Fewer API calls via intelligent batching and proper caching
- **Reduced Complexity**: Single state management pattern across entire app
- **Improved Reliability**: Conflict detection and automatic error recovery
- **Developer Experience**: Simpler mental model for state updates

### Success Metrics
- **Zero Local State**: No server data stored in component state or localStorage
- **Sub-100ms UI Updates**: Optimistic updates feel instant across all components
- **90%+ Save Success Rate**: Background saves complete reliably
- **Consistent Behavior**: Same editing patterns across tabs, editor, sidebar, context menus
- **Reduced API Calls**: 50% fewer requests via batching and proper cache strategy

## Code Cleanup Process

### Files to Remove/Clean
- ❌ **Remove localStorage usage** in `src/components/unified-page-editor.tsx` (lines 283-285)
- ❌ **Remove debug logging** throughout `src/hooks/use-pages-query.ts` 
- ❌ **Clean hasUnsavedChanges state** in `src/components/unified-page-editor.tsx` (replace with provider)
- ❌ **Remove debouncedTitleUpdate** in `src/components/unified-page-editor.tsx` (lines 334-345)
- ❌ **Clean manual cache updates** in `src/hooks/use-pages-query.ts` (lines 225-243)
- ❌ **Remove aggressive cache invalidation** (`staleTime: 0, gcTime: 0`) in components
- ❌ **Clean checkForUnsavedChanges** localStorage logic in `src/components/tabs-container.tsx`

### Legacy Code Patterns to Eliminate
```typescript
// ❌ Remove: Dual state management
const [headerTitle, setHeaderTitle] = useState(initialTitle);

// ❌ Remove: Manual cache manipulation
queries.forEach(query => {
  if (query.queryKey[0] === PAGES_QUERY_KEY) {
    queryClient.setQueryData(query.queryKey, updatedData)
  }
})

// ❌ Remove: localStorage backup
localStorage.setItem(`unified-page-${persistenceKey}`, jsonString);

// ❌ Remove: Inconsistent save patterns
if (tab.type === 'page') {
  pagesQuery.updatePage(tab.itemId, { title: editingValue });
}
```

## Version Control Plan

### Pre-Implementation Safety
```bash
# Create feature branch for state management refactor
git checkout -b feature/v9-unified-state-management
git push -u origin feature/v9-unified-state-management

# Tag current stable state for easy revert
git tag -a v9-state-before-refactor -m "State before V9 unified state management refactor"
git push origin v9-state-before-refactor
```

### Implementation Checkpoints
```bash
# After each major phase, create checkpoint
git add . && git commit -m "Phase 1: Enhanced UnifiedStateProvider base"
git add . && git commit -m "Phase 2: Page editor migration complete" 
git add . && git commit -m "Phase 3: Tabs and sidebar migration complete"
git add . && git commit -m "Phase 4: Local state cleanup complete"
git add . && git commit -m "Phase 5: Cache optimization complete"
```

### Emergency Rollback Commands
```bash
# Quick revert to last stable state
git reset --hard v9-state-before-refactor

# Selective rollback to specific phase
git reset --hard <phase-commit-hash>

# Revert specific problematic commit
git revert <problematic-commit-hash>
```

### Testing Strategy
- **After Each Phase**: Manual testing of affected components
- **Before Merge**: Full regression testing across all editing scenarios
- **Rollback Triggers**: Any breaking functionality or performance degradation

## Getting Started - Key Files to Study

### 🎯 **Essential Reading Order**

#### 1. **Architecture Foundation** (Start Here)
- 📁 `src/providers/app-providers.tsx` - Provider hierarchy and initialization
- 📁 `src/providers/unified-state-provider.tsx` - Current entity state aggregation
- 📁 `src/providers/ui-state-provider.tsx` - UI state patterns with localStorage

#### 2. **Current State Management Patterns**
- 📁 `src/hooks/use-pages-query.ts` - React Query patterns and cache management
- 📁 `src/hooks/use-tabs-query.ts` - Tab state with optimistic updates
- 📁 `src/hooks/use-products-query.ts` - Example entity query pattern

#### 3. **Component Integration Points**
- 📁 `src/components/unified-page-editor.tsx` - Page editing with mixed state
- 📁 `src/components/tabs-container.tsx` - Cross-component title editing
- 📁 `src/components/tab-query-content.tsx` - Page editor integration
- 📁 `src/components/app-sidebar-query.tsx` - Sidebar data display patterns

#### 4. **Data Flow Examples**
- 📁 `src/services/pages-db.ts` - Database service layer patterns
- 📁 `src/app/api/pages-db/route.ts` - API endpoint handling
- 📁 `src/types/models/Page.ts` - Data model structure

### 📚 **Key Concepts to Understand**

#### **Current React Query Usage**
```typescript
// Pattern: Optimistic updates with manual cache management
const updatePageMutation = useMutation({
  onSuccess: (updatedPage) => {
    queryClient.setQueryData([PAGE_QUERY_KEY, updatedPage.id], updatedPage)
    // Manual cache updates for consistency
  }
})
```

#### **Provider Aggregation Pattern**
```typescript
// UnifiedStateProvider aggregates all entity queries
const value = {
  products: { ...productsQuery },
  interfaces: { ...interfacesQuery },
  features: { ...featuresQuery },
  releases: { ...releasesQuery },
  pages: { /* missing - needs to be added */ }
}
```

#### **Cross-Component State Sync**
```typescript
// Current: Multiple update paths for same data
// Tab editing: pagesQuery.updatePage()
// Page editor: local state + manual save
// Goal: Single provider method for all updates
```

### 🔍 **Current Issues to Notice While Reading**
- **Dual State**: Same data in component state AND React Query
- **Inconsistent Saves**: Different timing patterns across components
- **Cache Thrashing**: Manual updates followed by invalidation
- **localStorage Abuse**: Server data backed up to localStorage
- **Missing Pages**: UnifiedStateProvider doesn't include pages yet

### 💡 **Implementation Mental Model**
```
Current: Component State ↔ React Query ↔ Server
Goal:    React Query (Provider) ↔ Server
         ↑
    All Components
```

## Solution Validation & Testing Strategy

### 1. Database Persistence Testing

#### **Real Database Verification**
```typescript
// Add to browser console for live testing
const testDatabaseSave = async (pageId) => {
  // 1. Get current server state
  const beforeResponse = await fetch(`/api/pages-db?id=${pageId}`);
  const beforeData = await beforeResponse.json();
  console.log('Before:', beforeData.data.title, beforeData.data.updated_at);
  
  // 2. Make change via UI (user types in title)
  // 3. Wait for debounced save (300ms for titles)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 4. Verify server was updated
  const afterResponse = await fetch(`/api/pages-db?id=${pageId}`);
  const afterData = await afterResponse.json();
  console.log('After:', afterData.data.title, afterData.data.updated_at);
  
  // 5. Validate
  const wasUpdated = new Date(afterData.data.updated_at) > new Date(beforeData.data.updated_at);
  console.log('✅ Database Updated:', wasUpdated);
};
```

#### **Supabase Direct Monitoring**
```sql
-- Run in Supabase SQL Editor during testing
SELECT 
  id, 
  title, 
  updated_at,
  last_block_update,
  block_count
FROM pages 
WHERE id = 'your-page-id'
ORDER BY updated_at DESC;

-- Monitor real-time changes
SELECT * FROM pages WHERE updated_at > NOW() - INTERVAL '1 minute';
```

#### **Network Tab Verification**
- **Chrome DevTools** → Network → Filter by "pages-db"
- **Verify API calls**: Should see PATCH requests after debounce delay
- **Check request payload**: Ensure correct data is being sent
- **Validate response**: 200 status with updated timestamp

### 2. Latency & Performance Testing

#### **Optimistic Update Speed Test**
```typescript
// Browser console performance test
const measureOptimisticLatency = () => {
  const startTime = performance.now();
  
  // Trigger UI change (e.g., type in title field)
  document.querySelector('[data-testid="page-title"]').focus();
  document.execCommand('insertText', false, 'New Title');
  
  // Measure time to UI update
  requestAnimationFrame(() => {
    const endTime = performance.now();
    console.log(`🚀 Optimistic Update Latency: ${endTime - startTime}ms`);
    console.log('✅ Target: <100ms', endTime - startTime < 100 ? '✅' : '❌');
  });
};
```

#### **Background Save Latency Test**
```typescript
// Test debounced save timing
const measureSaveLatency = async () => {
  const saveStartTime = performance.now();
  
  // Make change and wait for network request
  const networkPromise = new Promise(resolve => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('/api/pages-db')) {
          resolve(entry.responseEnd - entry.startTime);
        }
      }
    });
    observer.observe({ entryTypes: ['navigation', 'resource'] });
  });
  
  // Trigger change
  // ... UI interaction ...
  
  const saveTime = await networkPromise;
  console.log(`💾 Background Save Time: ${saveTime}ms`);
};
```

#### **Cross-Component Sync Speed**
```typescript
// Test sync across tabs, editor, sidebar
const testCrossComponentSync = () => {
  const startTime = performance.now();
  
  // 1. Change title in page editor
  const titleInput = document.querySelector('[data-testid="page-title"]');
  titleInput.value = 'Test Sync Title';
  titleInput.dispatchEvent(new Event('input'));
  
  // 2. Measure time for tab title to update
  requestAnimationFrame(() => {
    const tabTitle = document.querySelector('[data-tab-title]')?.textContent;
    const syncTime = performance.now() - startTime;
    
    console.log(`⚡ Cross-Component Sync: ${syncTime}ms`);
    console.log('✅ Target: <50ms', syncTime < 50 ? '✅' : '❌');
    console.log('Titles match:', titleInput.value === tabTitle);
  });
};
```

### 3. UI Accuracy Testing

#### **Visual State Verification**
```typescript
// Automated UI state checker
const validateUIState = (pageId) => {
  const pageTitle = document.querySelector('[data-testid="page-title"]')?.value;
  const tabTitle = document.querySelector(`[data-tab-id*="${pageId}"] .truncate`)?.textContent;
  const sidebarTitle = document.querySelector(`[data-page-id="${pageId}"] .font-medium`)?.textContent;
  
  console.log('📊 UI State Check:');
  console.log('Page Editor:', pageTitle);
  console.log('Tab Title:', tabTitle);
  console.log('Sidebar:', sidebarTitle);
  
  const isConsistent = pageTitle === tabTitle && tabTitle === sidebarTitle;
  console.log('✅ All Components Consistent:', isConsistent ? '✅' : '❌');
  
  return { pageTitle, tabTitle, sidebarTitle, isConsistent };
};
```

#### **Unsaved Changes Indicator Test**
```typescript
// Test visual feedback accuracy
const testUnsavedIndicators = () => {
  // 1. Make change
  // 2. Check orange dot appears in tab immediately
  // 3. Wait for save completion
  // 4. Check dot disappears
  // 5. Check "Saved at [time]" appears
  
  const hasUnsavedDot = document.querySelector('.bg-orange-400');
  const savedIndicator = document.querySelector('.text-green-400');
  
  console.log('🔶 Unsaved Indicator:', hasUnsavedDot ? 'Visible' : 'Hidden');
  console.log('✅ Saved Indicator:', savedIndicator ? 'Visible' : 'Hidden');
};
```

### 4. Component-Level Debugging

#### **React Query DevTools Integration**
```bash
# Add to development environment
npm install @tanstack/react-query-devtools
```

```typescript
// Add to query-provider.tsx for debugging
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function TanstackQueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

#### **Individual Component Testing**
```typescript
// Component isolation test harness
const testComponentInIsolation = {
  // Test UnifiedStateProvider directly
  testProvider: () => {
    // Note: useUnifiedPages() doesn't exist yet - will be created
    const { pages } = useUnifiedState();
    // After implementation: pages.updatePage('test-id', { title: 'Test Title' });
    // Verify React Query cache updates
  },
  
  // Test page editor without dependencies  
  testPageEditor: () => {
    // Mount with mock page data
    // Simulate user interactions
    // Verify provider calls
  },
  
  // Test tabs container
  testTabsContainer: () => {
    // Mount with mock tab data
    // Simulate title editing
    // Verify provider integration
  }
};
```

#### **Provider State Inspector**
```typescript
// Add to UnifiedStateProvider for debugging
const ProviderDebugger = () => {
  const { pages } = useUnifiedState();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Log all provider state changes
    console.log('📋 Provider State:', {
      pages: pages.pages?.length,
      isLoading: pages.isLoading,
      // Note: pendingSaves will be added in enhanced provider
      cacheKeys: queryClient.getQueryCache().getAll().map(q => q.queryKey)
    });
  }, [pages, queryClient]);
  
  return null;
};
```

### 5. Real User Simulation Testing

#### **End-to-End User Flows**
```typescript
// Real user behavior simulation
const simulateRealUser = async () => {
  console.log('🧪 Starting Real User Simulation...');
  
  // Scenario 1: Page title editing across components
  await testScenario1();
  
  // Scenario 2: Rapid content changes
  await testScenario2();
  
  // Scenario 3: Multi-tab concurrent editing
  await testScenario3();
  
  // Scenario 4: Network interruption recovery
  await testScenario4();
};

const testScenario1 = async () => {
  console.log('📝 Test: User edits page title in different places');
  
  // 1. User opens page in editor
  // 2. User edits title in page editor
  // 3. User switches to tab and edits same title
  // 4. User checks sidebar shows updated title
  // 5. User refreshes page and verifies persistence
  
  // Validate: All components show same title, no conflicts
};

const testScenario2 = async () => {
  console.log('⚡ Test: User types rapidly in content editor');
  
  // 1. User types continuously for 5 seconds
  // 2. User stops typing
  // 3. Wait for debounce + save
  // 4. Verify only reasonable number of API calls made
  
  // Validate: Efficient batching, no API spam
};

const testScenario3 = async () => {
  console.log('🗂️ Test: User opens same page in multiple tabs');
  
  // 1. Open page in tab A
  // 2. Open same page in tab B  
  // 3. Edit title in tab A
  // 4. Check tab B updates immediately
  // 5. Edit content in tab B
  // 6. Check tab A shows unsaved indicator
  
  // Validate: Real-time sync, conflict detection
};

const testScenario4 = async () => {
  console.log('🌐 Test: User edits while offline');
  
  // 1. User makes changes
  // 2. Simulate network failure (DevTools offline)
  // 3. Changes still appear in UI (optimistic)
  // 4. Restore network
  // 5. Verify retry and eventual consistency
  
  // Validate: Graceful offline handling
};
```

#### **Browser Automation for Regression Testing**
```javascript
// Playwright test for real browser automation
test('Cross-component title synchronization', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Open page in editor
  await page.click('[data-testid="page-link"]');
  
  // Edit title in page editor
  await page.fill('[data-testid="page-title"]', 'New Test Title');
  
  // Verify tab updates immediately
  await expect(page.locator('[data-tab-title]')).toContainText('New Test Title');
  
  // Wait for debounced save (300ms + network time)
  await page.waitForTimeout(500);
  
  // Verify database persistence
  const response = await page.request.get('/api/pages-db?id=test-page');
  const data = await response.json();
  expect(data.data.title).toBe('New Test Title');
});
```

### 6. Performance Benchmarks

#### **Success Criteria Validation**
```typescript
const validateSuccessCriteria = () => {
  return {
    // UI Responsiveness: <100ms optimistic updates
    optimisticUpdateSpeed: measureOptimisticLatency(),
    
    // API Efficiency: 50% fewer calls via batching
    apiCallReduction: measureAPICallCount(),
    
    // Cross-component sync: <50ms via React Query
    componentSyncSpeed: measureCrossComponentSync(),
    
    // Save success rate: >90% reliability
    saveReliability: measureSaveSuccessRate(),
    
    // Zero local state: no localStorage for server data
    localStateElimination: checkForLocalState(),
    
    // Consistent behavior: same patterns everywhere
    behaviorConsistency: validateConsistentPatterns()
  };
};

// Helper functions (to be implemented)
const measureAPICallCount = () => {
  // Monitor network requests before/after implementation
};

const measureSaveSuccessRate = () => {
  // Track successful vs failed saves over time
};

const checkForLocalState = () => {
  // Scan for inappropriate localStorage usage
  const prohibited = ['page-draft-', 'unified-page-', 'hasUnsavedChanges'];
  return prohibited.some(key => 
    Object.keys(localStorage).some(lsKey => lsKey.includes(key))
  );
};

const validateConsistentPatterns = () => {
  // Ensure all title editing goes through same provider method
};
```

## Task List
- **Phase 0**: Study key files and understand current patterns
- **Phase 1**: Enhance UnifiedStateProvider with optimistic update capabilities
- **Phase 2**: Migrate page editor to use provider exclusively (remove local state)
- **Phase 3**: Update tabs and sidebar to use provider for all edits
- **Phase 4**: Remove local state and localStorage dependencies completely
- **Phase 5**: Optimize React Query cache settings and cleanup debug code
- **Phase 6**: Execute comprehensive validation testing strategy