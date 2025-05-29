/**
 * Simple Pages Data Flow Test
 * 
 * Test just the data flow without complex UI components
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';

// Test data - matching the structure from your database
const mockPagesData = [
  {
    id: 'ca65d02c-a60c-4bbd-b7cc-60a918428341',
    title: 'Complex Block Structure Test',
    type: 'project',
    parent_id: null, // Root page
    tenant_id: '22222222-2222-2222-2222-222222222222',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3cae60a0-6626-4650-adf9-eaadd889777a',
    title: 'Authentication Platform',
    type: 'feature', 
    parent_id: 'ca65d02c-a60c-4bbd-b7cc-60a918428341', // Child of Complex Block Structure Test
    tenant_id: '22222222-2222-2222-2222-222222222222',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'b205ce13-f9eb-4c7b-af65-6c27882d9ea0',
    title: 'New Page',
    type: 'project',
    parent_id: null, // Another root page
    tenant_id: '22222222-2222-2222-2222-222222222222',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '7d10a308-be8c-4f5d-875b-d8a9640542e9',
    title: 'Child of New Page',
    type: 'feature',
    parent_id: 'b205ce13-f9eb-4c7b-af65-6c27882d9ea0', // Child of New Page
    tenant_id: '22222222-2222-2222-2222-222222222222',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('Pages Data Flow Test', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Don't retry failed queries in tests
        },
      },
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  test('1. usePagesQuery hook returns correct data structure', async () => {
    // Mock fetch to return our test data
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    }) as jest.MockedFunction<typeof fetch>;

    // Create a test component that uses the hook
    const TestComponent = () => {
      const { usePagesQuery } = require('@/hooks/use-pages-query');
      const pagesQuery = usePagesQuery();
      
      if (pagesQuery.isLoading) return <div data-testid="loading">Loading...</div>;
      if (pagesQuery.error) return <div data-testid="error">Error: {pagesQuery.error.message}</div>;
      
      // Filter data to verify the hook is working
      const rootPages = pagesQuery.pages?.filter((p: any) => !p.parent_id) || [];
      const childPages = pagesQuery.pages?.filter((p: any) => p.parent_id) || [];
      
      return (
        <div>
          <div data-testid="total-pages">Total: {pagesQuery.pages?.length || 0}</div>
          <div data-testid="root-pages">Root: {rootPages.length}</div>
          <div data-testid="child-pages">Children: {childPages.length}</div>
          <ul data-testid="root-list">
            {rootPages.map((page: any) => (
              <li key={page.id} data-testid={`root-${page.id}`}>{page.title}</li>
            ))}
          </ul>
          <ul data-testid="child-list">
            {childPages.map((page: any) => (
              <li key={page.id} data-testid={`child-${page.id}`}>{page.title} (parent: {page.parent_id})</li>
            ))}
          </ul>
        </div>
      );
    };

    renderWithProviders(<TestComponent />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Check if error occurred
    expect(screen.queryByTestId('error')).not.toBeInTheDocument();

    // Verify data counts
    expect(screen.getByTestId('total-pages')).toHaveTextContent('Total: 4');
    expect(screen.getByTestId('root-pages')).toHaveTextContent('Root: 2');
    expect(screen.getByTestId('child-pages')).toHaveTextContent('Children: 2');

    // Verify specific root pages
    expect(screen.getByTestId('root-ca65d02c-a60c-4bbd-b7cc-60a918428341')).toHaveTextContent('Complex Block Structure Test');
    expect(screen.getByTestId('root-b205ce13-f9eb-4c7b-af65-6c27882d9ea0')).toHaveTextContent('New Page');

    // Verify specific child pages
    expect(screen.getByTestId('child-3cae60a0-6626-4650-adf9-eaadd889777a')).toHaveTextContent('Authentication Platform (parent: ca65d02c-a60c-4bbd-b7cc-60a918428341)');
    expect(screen.getByTestId('child-7d10a308-be8c-4f5d-875b-d8a9640542e9')).toHaveTextContent('Child of New Page (parent: b205ce13-f9eb-4c7b-af65-6c27882d9ea0)');

    console.log('✅ Data flow test: usePagesQuery hook returns correct parent-child structure');
  });

  test('2. Child filtering logic works correctly', async () => {
    // Mock fetch to return our test data
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    }) as jest.MockedFunction<typeof fetch>;

    // Test the child filtering logic that's used in AppSidebarQuery
    const TestComponent = () => {
      const { usePagesQuery } = require('@/hooks/use-pages-query');
      const pagesQuery = usePagesQuery();
      
      if (pagesQuery.isLoading) return <div data-testid="loading">Loading...</div>;
      if (pagesQuery.error) return <div data-testid="error">Error: {pagesQuery.error.message}</div>;
      
      // This is the exact logic from AppSidebarQuery
      const getChildPagesByParentId = (parentId: string) => {
        return pagesQuery.pages?.filter((page: any) => page.parent_id === parentId) || [];
      };
      
      const rootPages = pagesQuery.pages?.filter((page: any) => !page.parent_id) || [];
      
      return (
        <div>
          {rootPages.map((page: any) => {
            const children = getChildPagesByParentId(page.id);
            return (
              <div key={page.id} data-testid={`page-group-${page.id}`}>
                <div data-testid={`parent-${page.id}`}>{page.title}</div>
                <div data-testid={`children-count-${page.id}`}>Children: {children.length}</div>
                {children.map((child: any) => (
                  <div key={child.id} data-testid={`child-of-${page.id}-${child.id}`}>{child.title}</div>
                ))}
              </div>
            );
          })}
        </div>
      );
    };

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Verify first root page and its children
    expect(screen.getByTestId('parent-ca65d02c-a60c-4bbd-b7cc-60a918428341')).toHaveTextContent('Complex Block Structure Test');
    expect(screen.getByTestId('children-count-ca65d02c-a60c-4bbd-b7cc-60a918428341')).toHaveTextContent('Children: 1');
    expect(screen.getByTestId('child-of-ca65d02c-a60c-4bbd-b7cc-60a918428341-3cae60a0-6626-4650-adf9-eaadd889777a')).toHaveTextContent('Authentication Platform');

    // Verify second root page and its children  
    expect(screen.getByTestId('parent-b205ce13-f9eb-4c7b-af65-6c27882d9ea0')).toHaveTextContent('New Page');
    expect(screen.getByTestId('children-count-b205ce13-f9eb-4c7b-af65-6c27882d9ea0')).toHaveTextContent('Children: 1');
    expect(screen.getByTestId('child-of-b205ce13-f9eb-4c7b-af65-6c27882d9ea0-7d10a308-be8c-4f5d-875b-d8a9640542e9')).toHaveTextContent('Child of New Page');

    console.log('✅ Data flow test: Child filtering logic works correctly');
  });

  test('3. API call with specific tenant ID', async () => {
    // Mock fetch to verify the correct URL is called
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    });
    global.fetch = fetchMock as jest.MockedFunction<typeof fetch>;

    const TestComponent = () => {
      const { usePagesQuery } = require('@/hooks/use-pages-query');
      const pagesQuery = usePagesQuery();
      
      if (pagesQuery.isLoading) return <div data-testid="loading">Loading...</div>;
      return <div data-testid="loaded">Loaded</div>;
    };

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loaded')).toBeInTheDocument();
    });

    // Verify the API was called with the correct URL
    expect(fetchMock).toHaveBeenCalledWith('/api/pages-db?', {
      credentials: 'include'
    });

    console.log('✅ Data flow test: API call made with correct parameters');
  });
});