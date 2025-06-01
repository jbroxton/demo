/**
 * Systematic Pages UI Debug Test
 * 
 * This test will systematically verify:
 * 1. Auth mocking works
 * 2. Pages API returns data
 * 3. usePagesQuery hook works
 * 4. Component renders root pages
 * 5. Component renders child pages
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';

// Mock the auth hook first
const mockUseAuth = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock other hooks we don't need for this test
jest.mock('@/hooks/use-products-query', () => ({
  useProductsQuery: () => ({ products: [], isLoading: false, error: null })
}));

jest.mock('@/hooks/use-interfaces-query', () => ({
  useInterfacesQuery: () => ({ interfaces: [], isLoading: false, error: null })
}));

jest.mock('@/hooks/use-features-query', () => ({
  useFeaturesQuery: () => ({ features: [], isLoading: false, error: null })
}));

jest.mock('@/hooks/use-releases-query', () => ({
  useReleasesQuery: () => ({ releases: [], isLoading: false, error: null })
}));

jest.mock('@/hooks/use-roadmaps-query', () => ({
  useRoadmapsQuery: () => ({ roadmaps: [], isLoading: false, error: null })
}));

jest.mock('@/hooks/use-tabs-query', () => ({
  useTabsQuery: () => ({ openTab: jest.fn() })
}));

// Mock page utils
jest.mock('@/utils/page-icons', () => ({
  getPageTypeIcon: () => 'div' // Return a simple element
}));

jest.mock('@/utils/page-parenting-rules', () => ({
  getAllowedChildTypes: () => [],
  canHaveChildren: () => true
}));

// Mock EntityCreator component
jest.mock('@/components/entity-creator', () => ({
  EntityCreator: ({ children }: any) => <div data-testid="entity-creator">{children}</div>
}));

// Mock PageContextMenu component
jest.mock('@/components/page-context-menu', () => ({
  PageContextMenu: ({ children }: any) => <div data-testid="page-context-menu">{children}</div>
}));

// Import the component after mocks
import { AppSidebarQuery } from '@/components/app-sidebar-query';

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

describe('Pages UI Debug Test', () => {
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
    
    // Mock successful auth
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: '22222222-2222-2222-2222-222222222222'
      },
      logout: jest.fn()
    });
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

  test('1. Auth mock works correctly', () => {
    const { user } = mockUseAuth();
    expect(user).toBeDefined();
    expect(user.tenantId).toBe('22222222-2222-2222-2222-222222222222');
    console.log('✅ Test 1: Auth mock works');
  });

  test('2. Pages API returns correct data', async () => {
    // Mock fetch to return our test data
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    }) as jest.MockedFunction<typeof fetch>;

    // Test the API directly
    const response = await fetch('/api/pages-db');
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(4);
    expect(result.data[0].title).toBe('Complex Block Structure Test');
    console.log('✅ Test 2: Pages API mock returns correct data');
  });

  test('3. usePagesQuery hook processes data correctly', async () => {
    // Mock fetch for this test
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
      
      if (pagesQuery.isLoading) return <div>Loading...</div>;
      if (pagesQuery.error) return <div>Error: {pagesQuery.error.message}</div>;
      
      return (
        <div>
          <div data-testid="total-pages">Total: {pagesQuery.pages?.length || 0}</div>
          <div data-testid="root-pages">
            Root: {pagesQuery.pages?.filter((p: any) => !p.parent_id).length || 0}
          </div>
          <div data-testid="child-pages">
            Children: {pagesQuery.pages?.filter((p: any) => p.parent_id).length || 0}
          </div>
        </div>
      );
    };

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('total-pages')).toHaveTextContent('Total: 4');
    });

    expect(screen.getByTestId('root-pages')).toHaveTextContent('Root: 2');
    expect(screen.getByTestId('child-pages')).toHaveTextContent('Children: 2');
    console.log('✅ Test 3: usePagesQuery hook processes data correctly');
  });

  test('4. AppSidebarQuery renders with pages data', async () => {
    // Mock fetch for this test
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    }) as jest.MockedFunction<typeof fetch>;

    renderWithProviders(<AppSidebarQuery />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Check if pages section exists
    expect(screen.getByText('Pages')).toBeInTheDocument();
    console.log('✅ Test 4: AppSidebarQuery component renders');
  });

  test('5. Root pages are rendered correctly', async () => {
    // Mock fetch for this test
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    }) as jest.MockedFunction<typeof fetch>;

    renderWithProviders(<AppSidebarQuery />);

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Check for root pages
    await waitFor(() => {
      expect(screen.getByText('Complex Block Structure Test')).toBeInTheDocument();
    });
    expect(screen.getByText('New Page')).toBeInTheDocument();
    
    console.log('✅ Test 5: Root pages are rendered correctly');
  });

  test('6. Child pages are rendered when parent is expanded', async () => {
    // Mock fetch for this test
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    }) as jest.MockedFunction<typeof fetch>;

    renderWithProviders(<AppSidebarQuery />);

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Root pages should be visible
    await waitFor(() => {
      expect(screen.getByText('Complex Block Structure Test')).toBeInTheDocument();
    });

    // Since pages are expanded by default in the component, child pages should be visible
    await waitFor(() => {
      expect(screen.getByText('Authentication Platform')).toBeInTheDocument();
    });
    expect(screen.getByText('Child of New Page')).toBeInTheDocument();
    
    console.log('✅ Test 6: Child pages are rendered when parent is expanded');
  });

  test('7. Debug console logs during render', async () => {
    // Spy on console.log
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock fetch for this test
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: mockPagesData
      })
    }) as jest.MockedFunction<typeof fetch>;

    renderWithProviders(<AppSidebarQuery />);

    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });

    // Check that our debug logs were called
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🔍 PAGES DEBUG - Raw pages data:'),
      expect.anything()
    );
    
    consoleSpy.mockRestore();
    console.log('✅ Test 7: Debug console logs work during render');
  });
});