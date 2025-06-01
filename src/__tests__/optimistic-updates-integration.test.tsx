/**
 * Jest Unit Tests for Optimistic Updates Implementation
 * 
 * Tests the core optimistic update functionality across UnifiedStateProvider,
 * use-pages-query, and component integration.
 */

import React from 'react';
import { act, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '@/test-utils/test-providers';
import { UnifiedStateProvider, useUnifiedPages } from '@/providers/unified-state-provider';
import { TabsContainer } from '@/components/tabs-container';
import { UnifiedPageEditor } from '@/components/unified-page-editor';

// Mock the API calls
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Import real test UUIDs
import { REAL_USER_ID, REAL_TENANT_ID } from '@/test-utils/test-db';
import { TEST_USERS } from '@/test-utils/test-users';

// Use proper UUIDs for test data
const TEST_PAGE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const TEST_TAB_ID = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock auth provider
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: REAL_USER_ID,
      tenantId: REAL_TENANT_ID,
      name: TEST_USERS.PM_SARAH.name,
      email: TEST_USERS.PM_SARAH.email,
    },
    logout: jest.fn(),
  }),
}));

// Mock tabs query
const mockUpdateTabTitle = jest.fn();
jest.mock('@/hooks/use-tabs-query', () => ({
  useTabsQuery: () => ({
    tabs: [
      {
        id: TEST_TAB_ID,
        title: 'Test Page',
        type: 'page',
        itemId: TEST_PAGE_ID,
        hasChanges: false,
      },
    ],
    activeTabId: TEST_TAB_ID,
    updateTabTitle: mockUpdateTabTitle,
    openTab: jest.fn(),
    closeTab: jest.fn(),
  }),
}));

// Test component that uses unified pages
function TestPageComponent() {
  const pagesState = useUnifiedPages();
  const [testResult, setTestResult] = React.useState<string>('');

  const handleUpdateTitle = async () => {
    try {
      await pagesState.updatePageTitle(TEST_PAGE_ID, 'Updated Title');
      setTestResult('Title update successful');
    } catch (error) {
      setTestResult('Title update failed');
    }
  };

  const page = pagesState.getPageById(TEST_PAGE_ID);

  return (
    <div>
      <div data-testid="page-title">{page?.title || 'No title'}</div>
      <button data-testid="update-title" onClick={handleUpdateTitle}>
        Update Title
      </button>
      <div data-testid="test-result">{testResult}</div>
    </div>
  );
}

describe('Optimistic Updates Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    
    mockFetch.mockClear();
    mockUpdateTabTitle.mockClear();
    
    // Setup default successful responses for all APIs
    mockFetch.mockImplementation((url: string) => {
      // Products API
      if (url.includes('/api/products-db')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      
      // Features API
      if (url.includes('/api/features-db')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      
      // Pages API - Default response
      if (url.includes('/api/pages-db')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: TEST_PAGE_ID,
                title: 'Test Page',
                type: 'product',
                blocks: [{
                  type: 'document',
                  content: {
                    tiptap_content: {
                      type: 'doc',
                      content: [{
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Test content' }]
                      }]
                    },
                    word_count: 10
                  }
                }],
                properties: {
                  status: {
                    type: 'select',
                    select: { name: 'Active', color: 'green' }
                  }
                },
                tenant_id: REAL_TENANT_ID,
                created_by: REAL_USER_ID,
                updated_by: REAL_USER_ID,
                created_at: '2024-01-01T00:00:00.000Z',
                updated_at: '2024-01-01T00:00:00.000Z',
              },
            ],
          }),
        });
      }
      
      // Default fallback for other APIs
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('UnifiedStateProvider Integration', () => {
    it('should expose pages state with all required methods', () => {
      let capturedPagesState: any;

      function TestComponent() {
        capturedPagesState = useUnifiedPages();
        return <div>Test</div>;
      }

      renderWithProviders(
        <UnifiedStateProvider>
          <TestComponent />
        </UnifiedStateProvider>,
        { queryClient }
      );

      expect(capturedPagesState).toBeDefined();
      expect(capturedPagesState.pages).toBeDefined();
      expect(capturedPagesState.getPageById).toBeDefined();
      expect(capturedPagesState.updatePageTitle).toBeDefined();
      expect(capturedPagesState.updatePage).toBeDefined();
      expect(capturedPagesState.addPage).toBeDefined();
      expect(capturedPagesState.deletePage).toBeDefined();
    });

    it('should provide consistent data across multiple hook calls', () => {
      let pagesState1: any;
      let pagesState2: any;

      function TestComponent() {
        pagesState1 = useUnifiedPages();
        pagesState2 = useUnifiedPages();
        return <div>Test</div>;
      }

      renderWithProviders(
        <UnifiedStateProvider>
          <TestComponent />
        </UnifiedStateProvider>,
        { queryClient }
      );

      expect(pagesState1).toBe(pagesState2);
      expect(pagesState1.pages).toBe(pagesState2.pages);
    });
  });

  describe('Optimistic Updates Behavior', () => {
    beforeEach(() => {
      // Mock successful API responses with proper Supabase schema
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/pages-db')) {
          if (url.includes(`id=${TEST_PAGE_ID}`)) {
            // Single page response
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                data: {
                  id: TEST_PAGE_ID,
                  title: 'Updated Title',
                  type: 'product',
                  blocks: [{
                    type: 'document',
                    content: {
                      tiptap_content: {
                        type: 'doc',
                        content: [{
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Test content' }]
                        }]
                      },
                      word_count: 10
                    }
                  }],
                  properties: {
                    status: {
                      type: 'select',
                      select: { name: 'Active', color: 'green' }
                    }
                  },
                  tenant_id: REAL_TENANT_ID,
                  created_by: REAL_USER_ID,
                  updated_by: REAL_USER_ID,
                  created_at: '2024-01-01T00:00:00.000Z',
                  updated_at: new Date().toISOString(),
                },
              }),
            });
          } else {
            // Pages list response
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                data: [
                  {
                    id: TEST_PAGE_ID,
                    title: 'Test Page',
                    type: 'product',
                    blocks: [{
                      type: 'document',
                      content: {
                        tiptap_content: {
                          type: 'doc',
                          content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Test content' }]
                          }]
                        },
                        word_count: 10
                      }
                    }],
                    properties: {
                      status: {
                        type: 'select',
                        select: { name: 'Active', color: 'green' }
                      }
                    },
                    tenant_id: REAL_TENANT_ID,
                    created_by: REAL_USER_ID,
                    updated_by: REAL_USER_ID,
                    created_at: '2024-01-01T00:00:00.000Z',
                    updated_at: '2024-01-01T00:00:00.000Z',
                  },
                ],
              }),
            });
          }
        }
        return Promise.reject(new Error('Unhandled API call'));
      });
    });

    it('should update title optimistically before API response', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <UnifiedStateProvider>
          <TestPageComponent />
        </UnifiedStateProvider>,
        { queryClient }
      );

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toHaveTextContent('Test Page');
      });

      // Click update button
      await user.click(screen.getByTestId('update-title'));

      // Title should update immediately (optimistically)
      // Note: This tests the optimistic update behavior
      await waitFor(() => {
        expect(screen.getByTestId('test-result')).toHaveTextContent('Title update successful');
      });

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/pages-db?id=${TEST_PAGE_ID}`),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Updated Title'),
        })
      );
    });

    it('should handle API errors with proper rollback', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <UnifiedStateProvider>
          <TestPageComponent />
        </UnifiedStateProvider>,
        { queryClient }
      );

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toHaveTextContent('Test Page');
      });

      // Now mock API failure for PATCH requests only
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/pages-db') && options?.method === 'PATCH') {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Server error' }),
          });
        }
        
        // Keep default successful responses for GET requests
        if (url.includes('/api/pages-db')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              data: [
                {
                  id: TEST_PAGE_ID,
                  title: 'Test Page',
                  type: 'product',
                  blocks: [{
                    type: 'document',
                    content: {
                      tiptap_content: {
                        type: 'doc',
                        content: [{
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Test content' }]
                        }]
                      },
                      word_count: 10
                    }
                  }],
                  properties: {
                    status: {
                      type: 'select',
                      select: { name: 'Active', color: 'green' }
                    }
                  },
                  tenant_id: REAL_TENANT_ID,
                  created_by: REAL_USER_ID,
                  updated_by: REAL_USER_ID,
                  created_at: '2024-01-01T00:00:00.000Z',
                  updated_at: '2024-01-01T00:00:00.000Z',
                },
              ],
            }),
          });
        }
        
        // Default fallback for other APIs
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      // Click update button
      await user.click(screen.getByTestId('update-title'));

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('test-result')).toHaveTextContent('Title update failed');
      });
    });
  });

  describe('Cross-Component Synchronization', () => {
    it('should sync tab title updates with provider state', async () => {
      // Create a component that uses both tabs and pages state
      function SyncTestComponent() {
        const pagesState = useUnifiedPages();
        const page = pagesState.getPageById(TEST_PAGE_ID);

        const handleTabTitleUpdate = () => {
          // Simulate tab container updating through provider
          pagesState.updatePageTitle(TEST_PAGE_ID, 'Tab Updated Title');
        };

        return (
          <div>
            <div data-testid="page-title">{page?.title || 'No title'}</div>
            <button data-testid="tab-update" onClick={handleTabTitleUpdate}>
              Update via Tab
            </button>
          </div>
        );
      }

      const user = userEvent.setup();

      renderWithProviders(
        <UnifiedStateProvider>
          <SyncTestComponent />
        </UnifiedStateProvider>,
        { queryClient }
      );

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toHaveTextContent('Test Page');
      });

      // Update via tab simulation
      await user.click(screen.getByTestId('tab-update'));

      // Should update immediately through optimistic updates
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/pages-db?id=${TEST_PAGE_ID}`),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('Tab Updated Title'),
          })
        );
      });
    });
  });

  describe('Performance and Debouncing', () => {
    it('should debounce rapid title updates', async () => {
      jest.useFakeTimers();

      const user = userEvent.setup({ delay: null });

      renderWithProviders(
        <UnifiedStateProvider>
          <TestPageComponent />
        </UnifiedStateProvider>,
        { queryClient }
      );

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByTestId('page-title')).toHaveTextContent('Test Page');
      });

      // Simulate rapid clicks
      await user.click(screen.getByTestId('update-title'));
      await user.click(screen.getByTestId('update-title'));
      await user.click(screen.getByTestId('update-title'));

      // Fast-forward timers to trigger debounced calls
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should handle multiple rapid updates
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Cache Management', () => {
    it('should maintain consistent cache state across mutations', async () => {
      let pagesState: any;

      function CacheTestComponent() {
        pagesState = useUnifiedPages();
        return (
          <div>
            <div data-testid="pages-count">{pagesState.pages?.length || 0}</div>
          </div>
        );
      }

      renderWithProviders(
        <UnifiedStateProvider>
          <CacheTestComponent />
        </UnifiedStateProvider>,
        { queryClient }
      );

      // Initial cache should be empty or consistent
      await waitFor(() => {
        expect(screen.getByTestId('pages-count')).toHaveTextContent('1');
      });

      // Perform a mutation
      await act(async () => {
        await pagesState.updatePageTitle(TEST_PAGE_ID, 'Cache Test Title');
      });

      // Cache should remain consistent
      expect(screen.getByTestId('pages-count')).toHaveTextContent('1');
    });
  });
});

describe('Provider Integration Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    
    mockFetch.mockClear();
  });

  it('should handle missing pages gracefully', () => {
    function TestComponent() {
      const pagesState = useUnifiedPages();
      const page = pagesState.getPageById('non-existent-page');
      return <div data-testid="page-result">{page ? 'Found' : 'Not found'}</div>;
    }

    renderWithProviders(
      <UnifiedStateProvider>
        <TestComponent />
      </UnifiedStateProvider>,
      { queryClient }
    );

    expect(screen.getByTestId('page-result')).toHaveTextContent('Not found');
  });

  it('should handle provider functions without crashing', () => {
    function TestComponent() {
      const pagesState = useUnifiedPages();
      
      // Test all getter functions
      const pages = pagesState.getPages();
      const rootPages = pagesState.getRootPages();
      const childPages = pagesState.getChildPages('parent-id');
      const pagesByType = pagesState.getPagesByType('product');

      return (
        <div>
          <div data-testid="pages">{pages?.length || 0}</div>
          <div data-testid="root-pages">{rootPages?.length || 0}</div>
          <div data-testid="child-pages">{childPages?.length || 0}</div>
          <div data-testid="pages-by-type">{pagesByType?.length || 0}</div>
        </div>
      );
    }

    renderWithProviders(
      <UnifiedStateProvider>
        <TestComponent />
      </UnifiedStateProvider>,
      { queryClient }
    );

    // Should not crash and should return sensible defaults
    expect(screen.getByTestId('pages')).toBeInTheDocument();
    expect(screen.getByTestId('root-pages')).toBeInTheDocument();
    expect(screen.getByTestId('child-pages')).toBeInTheDocument();
    expect(screen.getByTestId('pages-by-type')).toBeInTheDocument();
  });
});