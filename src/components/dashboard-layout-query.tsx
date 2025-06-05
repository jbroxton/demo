"use client"

import { useEffect } from 'react';
import { AppSidebarQuery } from '@/components/app-sidebar-query';
import { useAuth } from '@/providers/auth-provider';
import { TabQueryContent } from '@/components/tab-query-content';
import { TabsContainer } from '@/components/tabs-container';
import { useRouter } from 'next/navigation';
import { RightSidebar } from './rightsidebar/right-sidebar';
import { useUIState } from '@/providers/ui-state-provider';
import { ChevronLeft, ChevronRight, PanelRight, X } from 'lucide-react';
import { FeedbackSidebar } from './feedback/feedback-sidebar';
import { PagesSearchSidebar } from './pages-search-sidebar';

export default function WorkspaceLayout() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { 
    rightSidebarOpen, 
    leftSidebarCollapsed, 
    toggleLeftSidebar, 
    toggleRightSidebar,
    rightSidebarWidth,
    nestedSidebarOpen,
    nestedSidebarType,
    closeNestedSidebar
  } = useUIState();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 
        RESIZABLE SIDEBAR ARCHITECTURE:
        
        This component implements a 3-column CSS Grid layout:
        - Column 1: Left navigation (collapsible)
        - Column 2: Canvas/main content (responsive, takes remaining space)
        - Column 3: Right sidebar (resizable 280px-600px)
        
        The resize functionality works by:
        1. ResizeHandle component captures drag events
        2. Updates rightSidebarWidth state in UIStateProvider
        3. This component re-renders with new gridTemplateColumns
        4. CSS Grid automatically constrains all columns properly
        5. Canvas resizes without overlap, chat interface scales
        
        Critical: We use inline gridTemplateColumns style instead of CSS variables
        due to inheritance/specificity issues that prevented grid updates.
      */}
      <div
        className={`workspace-grid ${leftSidebarCollapsed ? 'navigator-collapsed' : ''} ${rightSidebarOpen ? 'utility-expanded' : ''} ${nestedSidebarOpen ? 'nested-sidebar-open' : ''}`}
        data-component="workspace"
      style={{
        // CRITICAL FIX: Direct gridTemplateColumns override using explicit pixel values  
        // This ensures CSS Grid properly constrains all three columns without CSS variable issues
        // Also accounts for nested sidebar overlay by adjusting content start position
        gridTemplateColumns: rightSidebarOpen 
          ? `${nestedSidebarOpen ? '380px' : (leftSidebarCollapsed ? '60px' : '280px')} 1fr ${rightSidebarWidth}px`
          : `${nestedSidebarOpen ? '380px' : (leftSidebarCollapsed ? '60px' : '280px')} 1fr 48px`
      } as React.CSSProperties}
      data-debug-grid={rightSidebarOpen 
        ? `${nestedSidebarOpen ? '380px' : (leftSidebarCollapsed ? '60px' : '280px')} 1fr ${rightSidebarWidth}px`
        : `${nestedSidebarOpen ? '380px' : (leftSidebarCollapsed ? '60px' : '280px')} 1fr 48px`}
      data-right-sidebar-open={rightSidebarOpen.toString()}
      data-right-sidebar-width={rightSidebarWidth}
      data-nested-sidebar-open={nestedSidebarOpen.toString()}
    >
      {/* Navigator - left sidebar */}
      <div
        className="navigator-panel custom-scrollbar"
        style={{ transition: 'width var(--transition-speed) var(--transition-timing)' }}
        data-section="navigator"
      >
        <style jsx>{`
          /* Hidden scrollbar */
          .custom-scrollbar::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
          .custom-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        <AppSidebarQuery collapsed={leftSidebarCollapsed} />

        {/* Navigator toggle button */}
        <button
          className="absolute top-4 right-[-10px] z-40 p-1.5 rounded-md bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white/70 hover:text-white/90 transition-colors duration-200 flex items-center justify-center"
          onClick={toggleLeftSidebar}
          aria-label={leftSidebarCollapsed ? "Expand navigator" : "Collapse navigator"}
          data-action="toggle-navigator"
        >
          {leftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nested Sidebar */}
      {nestedSidebarOpen && nestedSidebarType && (
        <>
          {/* Nested sidebar container */}
          <div className="fixed left-0 top-0 h-full z-40 flex" data-testid="nested-sidebar-container">
            {/* Show collapsed main sidebar */}
            <div className="w-[60px] bg-[#0A0A0A] border-r border-white/10">
              <AppSidebarQuery collapsed={true} />
            </div>
            
            {/* Nested sidebar content */}
            <div className="relative">
              {nestedSidebarType === 'feedback' && <FeedbackSidebar />}
              {nestedSidebarType === 'pages-search' && <PagesSearchSidebar />}
              
              {/* Close button - positioned like main sidebar toggle */}
              <button
                className="absolute top-4 right-[-10px] z-40 p-1.5 rounded-md bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white/70 hover:text-white/90 transition-colors duration-200 flex items-center justify-center"
                onClick={closeNestedSidebar}
                aria-label="Collapse navigator"
                data-testid="close-nested-sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Canvas container - main work area */}
      <div className="canvas-container" data-section="canvas">
        {/* Canvas tabs */}
        <div className="canvas-tabs" data-section="canvas-tabs">
          <TabsContainer />
        </div>

        {/* Canvas editor */}
        <div
          className="canvas-editor custom-scrollbar"
          style={{ transition: 'all var(--transition-speed) var(--transition-timing)' }}
          data-section="canvas-editor"
          data-testid="pages-container"
        >
          <TabQueryContent />
        </div>
      </div>

      {/* Utility panel - right sidebar (CSS Grid) */}
      <div className="utility-panel" data-section="utility-panel">
        <RightSidebar />
      </div>
    </div>
    </>
  );
}