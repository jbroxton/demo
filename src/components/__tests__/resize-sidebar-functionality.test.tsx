/**
 * Unit tests for resizable sidebar functionality
 * Tests validate that the sidebar can expand/close, layout resizes properly,
 * and content scales without overlapping
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UIStateProvider, useUIState } from '@/providers/ui-state-provider';
import { ResizeHandle } from '@/components/rightsidebar/resize-handle';

// Get the mocked localStorage from jest setup
const mockLocalStorage = window.localStorage as jest.Mocked<typeof window.localStorage>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <UIStateProvider>{children}</UIStateProvider>
    </QueryClientProvider>
  );
};

describe('Resizable Sidebar Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('UIStateProvider Resize State', () => {
    it('should initialize with default sidebar width', () => {
      const TestComponent = () => {
        const { rightSidebarWidth } = useUIState();
        return <div data-testid="sidebar-width">{rightSidebarWidth}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('400');
    });

    it('should load custom width from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('500');

      const TestComponent = () => {
        const { rightSidebarWidth } = useUIState();
        return <div data-testid="sidebar-width">{rightSidebarWidth}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('rightSidebarWidth');
      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('500');
    });

    it('should update sidebar width and persist to localStorage', () => {
      const TestComponent = () => {
        const { rightSidebarWidth, setRightSidebarWidth } = useUIState();

        return (
          <div>
            <div data-testid="sidebar-width">{rightSidebarWidth}</div>
            <button
              data-testid="update-width"
              onClick={() => setRightSidebarWidth(450)}
            >
              Update Width
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('update-width'));

      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('450');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rightSidebarWidth', '450');
    });

    it('should track resize state', () => {
      const TestComponent = () => {
        const { isResizing, setIsResizing } = useUIState();

        return (
          <div>
            <div data-testid="is-resizing">{isResizing.toString()}</div>
            <button
              data-testid="start-resize"
              onClick={() => setIsResizing(true)}
            >
              Start Resize
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-resizing')).toHaveTextContent('false');

      fireEvent.click(screen.getByTestId('start-resize'));

      expect(screen.getByTestId('is-resizing')).toHaveTextContent('true');
    });
  });

  describe('ResizeHandle Component', () => {
    it('should render resize handle with proper styling', () => {
      render(
        <TestWrapper>
          <ResizeHandle />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);
      expect(handle).toBeInTheDocument();
      expect(handle).toHaveClass('resize-handle');
    });

    it('should handle mouse down event and start resize', () => {
      const TestComponent = () => {
        const { isResizing } = useUIState();
        return (
          <div>
            <ResizeHandle />
            <div data-testid="resize-status">{isResizing.toString()}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);

      act(() => {
        fireEvent.mouseDown(handle, { clientX: 300 });
      });

      expect(screen.getByTestId('resize-status')).toHaveTextContent('true');
    });

    it('should enforce minimum width boundary during resize', () => {
      const TestComponent = () => {
        const { rightSidebarWidth } = useUIState();
        return (
          <div>
            <ResizeHandle />
            <div data-testid="sidebar-width">{rightSidebarWidth}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);

      // Start resize at position 400
      act(() => {
        fireEvent.mouseDown(handle, { clientX: 400 });
      });

      // Try to drag beyond minimum (280px) - drag right to make smaller
      act(() => {
        fireEvent.mouseMove(window, { clientX: 600 }); // Large movement
      });

      // Width should be clamped to minimum
      expect(parseInt(screen.getByTestId('sidebar-width').textContent || '0')).toBeGreaterThanOrEqual(280);
    });

    it('should enforce maximum width boundary during resize', () => {
      const TestComponent = () => {
        const { rightSidebarWidth } = useUIState();
        return (
          <div>
            <ResizeHandle />
            <div data-testid="sidebar-width">{rightSidebarWidth}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);

      // Start resize at position 400
      act(() => {
        fireEvent.mouseDown(handle, { clientX: 400 });
      });

      // Try to drag beyond maximum (600px) - drag left to make larger
      act(() => {
        fireEvent.mouseMove(window, { clientX: 100 }); // Large movement left
      });

      // Width should be clamped to maximum
      expect(parseInt(screen.getByTestId('sidebar-width').textContent || '0')).toBeLessThanOrEqual(600);
    });

    it('should stop resizing on mouse up', () => {
      const TestComponent = () => {
        const { isResizing } = useUIState();
        return (
          <div>
            <ResizeHandle />
            <div data-testid="resize-status">{isResizing.toString()}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);

      // Start resize
      act(() => {
        fireEvent.mouseDown(handle, { clientX: 300 });
      });

      expect(screen.getByTestId('resize-status')).toHaveTextContent('true');

      // Stop resize
      act(() => {
        fireEvent.mouseUp(window);
      });

      expect(screen.getByTestId('resize-status')).toHaveTextContent('false');
    });

    it('should handle touch events for mobile devices', () => {
      const TestComponent = () => {
        const { isResizing } = useUIState();
        return (
          <div>
            <ResizeHandle />
            <div data-testid="resize-status">{isResizing.toString()}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);

      // Start touch resize
      act(() => {
        fireEvent.touchStart(handle, {
          touches: [{ clientX: 300 }],
        });
      });

      expect(screen.getByTestId('resize-status')).toHaveTextContent('true');

      // Stop touch resize
      act(() => {
        fireEvent.touchEnd(window);
      });

      expect(screen.getByTestId('resize-status')).toHaveTextContent('false');
    });
  });

  describe('Layout Responsiveness', () => {
    // Mock window.getComputedStyle
    const mockGetComputedStyle = jest.fn();
    beforeAll(() => {
      global.getComputedStyle = mockGetComputedStyle;
    });

    it('should apply dynamic width to CSS custom property', () => {
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: jest.fn().mockReturnValue('450px'),
      });

      const TestComponent = () => {
        const { rightSidebarWidth, rightSidebarOpen } = useUIState();

        const style = {
          '--dynamic-right-sidebar-width': rightSidebarOpen 
            ? `${rightSidebarWidth}px` 
            : '48px'
        } as React.CSSProperties;

        return (
          <div data-testid="layout-container" style={style}>
            Layout Container
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const container = screen.getByTestId('layout-container');
      expect(container).toHaveStyle('--dynamic-right-sidebar-width: 400px');
    });

    it('should use collapsed width when sidebar is closed', () => {
      const TestComponent = () => {
        const { rightSidebarWidth, rightSidebarOpen, setRightSidebarOpen } = useUIState();

        const style = {
          '--dynamic-right-sidebar-width': rightSidebarOpen 
            ? `${rightSidebarWidth}px` 
            : '48px'
        } as React.CSSProperties;

        return (
          <div>
            <div data-testid="layout-container" style={style}>
              Layout Container
            </div>
            <button
              data-testid="close-sidebar"
              onClick={() => setRightSidebarOpen(false)}
            >
              Close Sidebar
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('close-sidebar'));

      const container = screen.getByTestId('layout-container');
      expect(container).toHaveStyle('--dynamic-right-sidebar-width: 48px');
    });

    it('should prevent content overlap by applying proper grid sizing', () => {
      // This test verifies that the grid system adapts to width changes
      const TestComponent = () => {
        const { rightSidebarWidth, rightSidebarOpen } = useUIState();

        const gridTemplate = rightSidebarOpen
          ? `1fr ${rightSidebarWidth}px`
          : '1fr 48px';

        return (
          <div 
            data-testid="grid-container"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div data-testid="main-content">Main Content</div>
            <div data-testid="sidebar-content">Sidebar Content</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const gridContainer = screen.getByTestId('grid-container');
      expect(gridContainer).toHaveStyle('grid-template-columns: 1fr 400px');
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should support keyboard navigation with arrow keys', () => {
      const TestComponent = () => {
        const { rightSidebarWidth } = useUIState();
        return (
          <div>
            <ResizeHandle />
            <div data-testid="sidebar-width">{rightSidebarWidth}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);
      handle.focus();

      const initialWidth = parseInt(screen.getByTestId('sidebar-width').textContent || '0');

      // Test left arrow (increase width)
      act(() => {
        fireEvent.keyDown(handle, { key: 'ArrowLeft' });
      });

      const widthAfterLeft = parseInt(screen.getByTestId('sidebar-width').textContent || '0');
      expect(widthAfterLeft).toBeGreaterThan(initialWidth);

      // Test right arrow (decrease width)
      act(() => {
        fireEvent.keyDown(handle, { key: 'ArrowRight' });
      });

      const widthAfterRight = parseInt(screen.getByTestId('sidebar-width').textContent || '0');
      expect(widthAfterRight).toBeLessThan(widthAfterLeft);
    });

    it('should have proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <ResizeHandle />
        </TestWrapper>
      );

      const handle = screen.getByLabelText(/resize right sidebar/i);
      expect(handle).toHaveAttribute('role', 'separator');
      expect(handle).toHaveAttribute('aria-orientation', 'vertical');
      expect(handle).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid localStorage values gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');

      const TestComponent = () => {
        const { rightSidebarWidth } = useUIState();
        return <div data-testid="sidebar-width">{rightSidebarWidth}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should fall back to default width
      expect(screen.getByTestId('sidebar-width')).toHaveTextContent('400');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const TestComponent = () => {
        const { setRightSidebarWidth } = useUIState();

        return (
          <button
            data-testid="update-width"
            onClick={() => setRightSidebarWidth(450)}
          >
            Update Width
          </button>
        );
      };

      // Should not throw error
      expect(() => {
        render(
          <TestWrapper>
            <TestComponent />
          </TestWrapper>
        );
        fireEvent.click(screen.getByTestId('update-width'));
      }).not.toThrow();
    });

    it('should clamp extreme width values', () => {
      const TestComponent = () => {
        const { rightSidebarWidth, setRightSidebarWidth } = useUIState();

        return (
          <div>
            <div data-testid="sidebar-width">{rightSidebarWidth}</div>
            <button
              data-testid="set-extreme-min"
              onClick={() => setRightSidebarWidth(100)} // Below minimum
            >
              Set Extreme Min
            </button>
            <button
              data-testid="set-extreme-max"
              onClick={() => setRightSidebarWidth(1000)} // Above maximum
            >
              Set Extreme Max
            </button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Test minimum clamping
      fireEvent.click(screen.getByTestId('set-extreme-min'));
      expect(parseInt(screen.getByTestId('sidebar-width').textContent || '0')).toBeGreaterThanOrEqual(280);

      // Test maximum clamping
      fireEvent.click(screen.getByTestId('set-extreme-max'));
      expect(parseInt(screen.getByTestId('sidebar-width').textContent || '0')).toBeLessThanOrEqual(600);
    });
  });
});