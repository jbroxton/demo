'use client';

import React, { createContext, useState, useContext, useCallback, useMemo, ReactNode, useEffect } from 'react';

// Define the type for right sidebar tab
type RightSidebarTab = 'chat' | 'todo';

// Define the context interface
interface UIStateContextType {
  // Right sidebar state
  rightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  setRightSidebarOpen: (open: boolean) => void;
  activeRightTab: RightSidebarTab;
  setActiveRightTab: (tab: RightSidebarTab) => void;

  // Right sidebar resize state
  rightSidebarWidth: number;
  setRightSidebarWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  rightSidebarMinWidth: number;
  rightSidebarMaxWidth: number;

  // Left sidebar state
  leftSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
}

// Create context with default values
const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export interface UIStateProviderProps {
  children: ReactNode;
}

export function UIStateProvider({ children }: UIStateProviderProps) {
  // Constants for sidebar sizing
  const rightSidebarMinWidth = 280;
  const rightSidebarMaxWidth = 600;
  const defaultRightSidebarWidth = 400;

  // State for right sidebar
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<RightSidebarTab>('chat');

  // State for right sidebar resizing
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(defaultRightSidebarWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // State for left sidebar
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState<boolean>(false);

  // Initialize state from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Right sidebar state
        const savedRightSidebarState = localStorage.getItem('rightSidebarOpen');
        if (savedRightSidebarState !== null) {
          setRightSidebarOpen(savedRightSidebarState === 'true');
        }

        // Active right tab
        const savedActiveTab = localStorage.getItem('activeRightTab');
        if (savedActiveTab === 'chat' || savedActiveTab === 'todo') {
          setActiveRightTab(savedActiveTab);
        }

        // Right sidebar width
        const savedRightSidebarWidth = localStorage.getItem('rightSidebarWidth');
        if (savedRightSidebarWidth !== null) {
          const width = parseInt(savedRightSidebarWidth, 10);
          if (width >= rightSidebarMinWidth && width <= rightSidebarMaxWidth) {
            setRightSidebarWidth(width);
          }
        }

        // Left sidebar state
        const savedLeftSidebarState = localStorage.getItem('leftSidebarCollapsed');
        if (savedLeftSidebarState !== null) {
          setLeftSidebarCollapsed(savedLeftSidebarState === 'true');
        }
      } catch (error) {
        console.error('Failed to load UI state from localStorage:', error);
      }
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rightSidebarOpen', rightSidebarOpen.toString());
        localStorage.setItem('activeRightTab', activeRightTab);
        localStorage.setItem('rightSidebarWidth', rightSidebarWidth.toString());
        localStorage.setItem('leftSidebarCollapsed', leftSidebarCollapsed.toString());
      } catch (error) {
        console.error('Failed to save UI state to localStorage:', error);
      }
    }
  }, [rightSidebarOpen, activeRightTab, rightSidebarWidth, leftSidebarCollapsed]);

  // Toggle function for right sidebar
  const toggleRightSidebar = useCallback(() => {
    setRightSidebarOpen((prev) => !prev);
  }, []);

  // Toggle function for left sidebar
  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarCollapsed((prev) => !prev);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // Right sidebar
      rightSidebarOpen,
      toggleRightSidebar,
      setRightSidebarOpen,
      activeRightTab,
      setActiveRightTab,

      // Right sidebar resize
      rightSidebarWidth,
      setRightSidebarWidth,
      isResizing,
      setIsResizing,
      rightSidebarMinWidth,
      rightSidebarMaxWidth,

      // Left sidebar
      leftSidebarCollapsed,
      toggleLeftSidebar,
      setLeftSidebarCollapsed
    }),
    [rightSidebarOpen, toggleRightSidebar, activeRightTab, rightSidebarWidth, isResizing, leftSidebarCollapsed, toggleLeftSidebar]
  );

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
}

// Custom hook to use the UI state
export function useUIState() {
  const context = useContext(UIStateContext);

  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }

  return context;
}