/**
 * Integration tests for resize sidebar layout behavior
 * Tests validate proper layout responsiveness, content scaling,
 * and prevention of overlapping when sidebar width changes
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UIStateProvider } from '@/providers/ui-state-provider';
import DashboardLayoutQuery from '@/components/dashboard-layout-query';

// Get the mocked localStorage from jest setup
const mockLocalStorage = window.localStorage as jest.Mocked<typeof window.localStorage>;

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <UIStateProvider>{children}</UIStateProvider>
    </QueryClientProvider>
  );
};

// Mock component that simulates main content area
const MockMainContent: React.FC<{ width?: string }> = ({ width = '100%' }) => (
  <div 
    data-testid="main-content" 
    style={{ width, backgroundColor: '#f0f0f0', minHeight: '500px' }}
  >
    <div data-testid="content-item-1" style={{ width: '200px', height: '100px' }}>
      Content Item 1
    </div>
    <div data-testid="content-item-2" style={{ width: '300px', height: '150px' }}>
      Content Item 2
    </div>
    <div data-testid="scrollable-content" style={{ overflowX: 'auto', width: '100%' }}>
      <div style={{ width: '800px', height: '50px' }}>Wide scrollable content</div>
    </div>
  </div>
);

// Mock sidebar content
const MockSidebarContent: React.FC<{ width?: number }> = ({ width = 400 }) => (
  <div 
    data-testid="sidebar-content" 
    style={{ 
      width: `${width}px`, 
      backgroundColor: '#e0e0e0', 
      minHeight: '500px',
      overflow: 'hidden'
    }}
  >
    <div data-testid="sidebar-item-1" style={{ padding: '16px' }}>
      Sidebar Item 1
    </div>
    <div data-testid="sidebar-item-2" style={{ padding: '16px' }}>
      Sidebar Item 2
    </div>
    <div data-testid="chat-interface" style={{ padding: '16px', height: '300px' }}>
      <div style={{ width: '100%', height: '200px', border: '1px solid #ccc' }}>
        Chat Interface
      </div>
    </div>
  </div>
);

describe('Resize Layout Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Layout Container Behavior', () => {
    it('should render with correct initial CSS grid layout', () => {
      const TestLayoutComponent = () => {
        const { rightSidebarWidth, rightSidebarOpen } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div 
            data-testid="dashboard-grid"
            className="grid h-screen"
            style={{
              gridTemplateColumns: rightSidebarOpen 
                ? `1fr ${rightSidebarWidth}px` 
                : '1fr 48px',
              '--dynamic-right-sidebar-width': rightSidebarOpen 
                ? `${rightSidebarWidth}px` 
                : '48px'
            } as React.CSSProperties}
          >
            <MockMainContent />
            <MockSidebarContent width={rightSidebarWidth} />
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestLayoutComponent />
        </TestWrapper>
      );

      const gridContainer = screen.getByTestId('dashboard-grid');
      expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 400px');
      expect(gridContainer).toHaveStyle('--dynamic-right-sidebar-width: 400px');
    });

    it('should update grid layout when sidebar width changes', async () => {
      const TestLayoutComponent = () => {
        const { rightSidebarWidth, rightSidebarOpen, setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div>
            <div 
              data-testid="dashboard-grid"
              className="grid h-screen"
              style={{
                gridTemplateColumns: rightSidebarOpen 
                  ? `1fr ${rightSidebarWidth}px` 
                  : '1fr 48px'
              }}
            >
              <MockMainContent />
              <MockSidebarContent width={rightSidebarWidth} />
            </div>
            <button
              data-testid="resize-to-500"
              onClick={() => setRightSidebarWidth(500)}
            >
              Resize to 500px
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestLayoutComponent />
        </TestWrapper>
      );

      const gridContainer = screen.getByTestId('dashboard-grid');
      expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 400px');

      // Resize sidebar
      fireEvent.click(screen.getByTestId('resize-to-500'));

      await waitFor(() => {
        expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 500px');
      });
    });

    it('should handle sidebar collapse/expand correctly', async () => {
      const TestLayoutComponent = () => {
        const { rightSidebarWidth, rightSidebarOpen, setRightSidebarOpen } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div>
            <div 
              data-testid="dashboard-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: rightSidebarOpen 
                  ? `1fr ${rightSidebarWidth}px` 
                  : '1fr 48px'
              }}
            >
              <MockMainContent />
              <MockSidebarContent width={rightSidebarOpen ? rightSidebarWidth : 48} />
            </div>
            <button
              data-testid="toggle-sidebar"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              Toggle Sidebar
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestLayoutComponent />
        </TestWrapper>
      );

      const gridContainer = screen.getByTestId('dashboard-grid');
      
      // Initially open
      expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 400px');

      // Close sidebar
      fireEvent.click(screen.getByTestId('toggle-sidebar'));

      await waitFor(() => {
        expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 48px');
      });

      // Open sidebar again
      fireEvent.click(screen.getByTestId('toggle-sidebar'));

      await waitFor(() => {
        expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 400px');
      });
    });
  });

  describe('Content Scaling and Responsiveness', () => {
    it('should prevent content overlap when sidebar expands', () => {
      const TestLayoutComponent = () => {
        const { rightSidebarWidth, setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div>
            <div 
              data-testid="dashboard-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `1fr ${rightSidebarWidth}px`,
                width: '1200px', // Fixed container width
                gap: '0px'
              }}
            >
              <div data-testid="main-content-area" style={{ overflow: 'hidden' }}>
                <MockMainContent />
              </div>
              <div data-testid="sidebar-area">
                <MockSidebarContent width={rightSidebarWidth} />
              </div>
            </div>
            <button
              data-testid="expand-sidebar"
              onClick={() => setRightSidebarWidth(500)}
            >
              Expand Sidebar
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestLayoutComponent />
        </TestWrapper>
      );

      const gridContainer = screen.getByTestId('dashboard-grid');
      const mainContent = screen.getByTestId('main-content-area');
      const sidebarArea = screen.getByTestId('sidebar-area');

      // Check initial layout
      expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 400px');

      // Expand sidebar
      fireEvent.click(screen.getByTestId('expand-sidebar'));

      // Verify layout updates without overlap
      expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 500px');
      
      // Main content should still be contained within its grid area
      const mainContentRect = mainContent.getBoundingClientRect();
      const sidebarRect = sidebarArea.getBoundingClientRect();
      
      // Content areas should not overlap
      expect(mainContentRect.right).toBeLessThanOrEqual(sidebarRect.left);
    });

    it('should handle content scaling when sidebar reaches maximum width', () => {
      const TestLayoutComponent = () => {
        const { rightSidebarWidth, setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div>
            <div 
              data-testid="dashboard-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `1fr ${rightSidebarWidth}px`,
                width: '1000px', // Smaller container to test scaling
              }}
            >
              <div data-testid="main-content-area" style={{ minWidth: 0 }}>
                <MockMainContent />
              </div>
              <MockSidebarContent width={rightSidebarWidth} />
            </div>
            <button
              data-testid="maximize-sidebar"
              onClick={() => setRightSidebarWidth(600)} // Maximum width
            >
              Maximize Sidebar
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestLayoutComponent />
        </TestWrapper>
      );

      // Maximize sidebar
      fireEvent.click(screen.getByTestId('maximize-sidebar'));

      const gridContainer = screen.getByTestId('dashboard-grid');
      expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 600px');

      // Main content area should have minimal space but not be negative
      const mainContentArea = screen.getByTestId('main-content-area');
      const mainContentRect = mainContentArea.getBoundingClientRect();
      expect(mainContentRect.width).toBeGreaterThan(0);
    });

    it('should maintain minimum content width when sidebar is at maximum', () => {
      const TestLayoutComponent = () => {
        const { rightSidebarWidth, setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div>
            <div 
              data-testid="dashboard-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `minmax(300px, 1fr) ${rightSidebarWidth}px`,
                width: '1000px',
              }}
            >
              <div data-testid="main-content-area">
                <MockMainContent />
              </div>
              <MockSidebarContent width={rightSidebarWidth} />
            </div>
            <button
              data-testid="test-extreme-resize"
              onClick={() => setRightSidebarWidth(600)}
            >
              Test Extreme Resize
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestLayoutComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('test-extreme-resize'));

      const mainContentArea = screen.getByTestId('main-content-area');
      const mainContentRect = mainContentArea.getBoundingClientRect();
      
      // Main content should maintain minimum width of 300px
      expect(mainContentRect.width).toBeGreaterThanOrEqual(300);
    });
  });

  describe('Chat Interface Scaling', () => {
    it('should scale chat interface properly when sidebar resizes', async () => {
      const TestChatComponent = () => {
        const { rightSidebarWidth, setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div>
            <div 
              data-testid="sidebar-container"
              style={{ width: `${rightSidebarWidth}px` }}
            >
              <div 
                data-testid="chat-interface"
                style={{ 
                  width: '100%', 
                  padding: '16px',
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  data-testid="chat-messages"
                  style={{ 
                    width: '100%', 
                    height: '200px',
                    border: '1px solid #ccc',
                    overflow: 'auto'
                  }}
                >
                  <div data-testid="message-1" style={{ padding: '8px' }}>
                    Chat message that should wrap properly
                  </div>
                  <div data-testid="message-2" style={{ padding: '8px' }}>
                    Another message that needs to scale with sidebar width
                  </div>
                </div>
                <input 
                  data-testid="chat-input"
                  style={{ width: '100%', marginTop: '8px' }}
                  placeholder="Type a message..."
                />
              </div>
            </div>
            <button
              data-testid="resize-chat"
              onClick={() => setRightSidebarWidth(500)}
            >
              Resize Chat
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestChatComponent />
        </TestWrapper>
      );

      const chatInterface = screen.getByTestId('chat-interface');
      const chatInput = screen.getByTestId('chat-input');
      
      // Get initial dimensions
      const initialChatRect = chatInterface.getBoundingClientRect();
      const initialInputRect = chatInput.getBoundingClientRect();

      // Resize sidebar
      fireEvent.click(screen.getByTestId('resize-chat'));

      await waitFor(() => {
        const newChatRect = chatInterface.getBoundingClientRect();
        const newInputRect = chatInput.getBoundingClientRect();
        
        // Chat interface should have grown with sidebar
        expect(newChatRect.width).toBeGreaterThan(initialChatRect.width);
        expect(newInputRect.width).toBeGreaterThan(initialInputRect.width);
      });
    });

    it('should maintain chat usability at minimum sidebar width', () => {
      const TestChatComponent = () => {
        const { setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        React.useEffect(() => {
          setRightSidebarWidth(280); // Minimum width
        }, [setRightSidebarWidth]);

        return (
          <div>
            <div 
              data-testid="sidebar-container"
              style={{ width: '280px' }}
            >
              <div 
                data-testid="chat-interface"
                style={{ 
                  width: '100%', 
                  padding: '16px',
                  boxSizing: 'border-box'
                }}
              >
                <div 
                  data-testid="chat-messages"
                  style={{ 
                    width: '100%', 
                    minHeight: '150px',
                    border: '1px solid #ccc'
                  }}
                >
                  Chat Messages
                </div>
                <input 
                  data-testid="chat-input"
                  style={{ width: '100%', marginTop: '8px' }}
                  placeholder="Type a message..."
                />
              </div>
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestChatComponent />
        </TestWrapper>
      );

      const chatInterface = screen.getByTestId('chat-interface');
      const chatInput = screen.getByTestId('chat-input');
      
      // Even at minimum width, chat should be usable
      const chatRect = chatInterface.getBoundingClientRect();
      const inputRect = chatInput.getBoundingClientRect();
      
      expect(chatRect.width).toBeGreaterThan(200); // Reasonable minimum
      expect(inputRect.width).toBeGreaterThan(200);
    });
  });

  describe('Responsive Behavior on Different Screen Sizes', () => {
    it('should handle small screen sizes gracefully', () => {
      // Mock smaller screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const TestResponsiveComponent = () => {
        const { rightSidebarWidth, setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        // Simulate responsive behavior
        const adjustedWidth = Math.min(rightSidebarWidth, window.innerWidth * 0.4);

        return (
          <div>
            <div 
              data-testid="responsive-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `1fr ${adjustedWidth}px`,
                width: '100vw'
              }}
            >
              <MockMainContent />
              <MockSidebarContent width={adjustedWidth} />
            </div>
            <button
              data-testid="test-responsive"
              onClick={() => setRightSidebarWidth(500)}
            >
              Test Responsive
            </button>
            <div data-testid="adjusted-width">{adjustedWidth}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestResponsiveComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('test-responsive'));

      // Width should be capped at 40% of screen width (768 * 0.4 = 307.2)
      const adjustedWidth = parseInt(screen.getByTestId('adjusted-width').textContent || '0');
      expect(adjustedWidth).toBeLessThanOrEqual(307);
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause excessive re-renders during resize', () => {
      let renderCount = 0;

      const TestPerformanceComponent = () => {
        renderCount++;
        
        const { rightSidebarWidth, setRightSidebarWidth } = React.useContext(
          require('@/providers/ui-state-provider').UIStateContext
        );

        return (
          <div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="sidebar-width">{rightSidebarWidth}</div>
            <button
              data-testid="multiple-updates"
              onClick={() => {
                setRightSidebarWidth(350);
                setRightSidebarWidth(450);
                setRightSidebarWidth(550);
              }}
            >
              Multiple Updates
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestPerformanceComponent />
        </TestWrapper>
      );

      const initialRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0');

      // Trigger multiple updates
      fireEvent.click(screen.getByTestId('multiple-updates'));

      const finalRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0');
      
      // Should only render for the final state, not all intermediate states
      expect(finalRenderCount - initialRenderCount).toBeLessThanOrEqual(2);
      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('550');
    });
  });
});