"use client"

import { useEffect } from 'react';
import { AppSidebarQuery } from '@/components/app-sidebar-query';
import { useAuth } from '@/providers/auth-provider';
import { TabQueryContent } from '@/components/tab-query-content';
import { TabsContainer } from '@/components/tabs-container';
import { useRouter } from 'next/navigation';
import { RightSidebar } from './rightsidebar/right-sidebar';
import { useUIState } from '@/providers/ui-state-provider';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WorkspaceLayout() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { rightSidebarOpen, leftSidebarCollapsed, toggleLeftSidebar } = useUIState();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div
      className={`workspace-grid ${leftSidebarCollapsed ? 'navigator-collapsed' : ''} ${rightSidebarOpen ? 'utility-expanded' : ''}`}
      data-component="workspace"
    >
      {/* Navigator - left sidebar */}
      <div
        className="navigator-panel custom-scrollbar"
        style={{ transition: 'width var(--transition-speed) var(--transition-timing)' }}
        data-section="navigator"
      >
        <style jsx>{`
          /* Custom scrollbar */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(80, 80, 80, 0.3);
            border-radius: 4px;
            border: 2px solid transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(100, 100, 100, 0.5);
          }
        `}</style>

        <AppSidebarQuery collapsed={leftSidebarCollapsed} />

        {/* Navigator toggle button */}
        <button
          className="absolute top-4 right-[-12px] z-40 p-1 rounded-full bg-[#232326] hover:bg-[#2a2a2c] text-white/70 hover:text-white/90 transition-colors duration-200"
          onClick={toggleLeftSidebar}
          aria-label={leftSidebarCollapsed ? "Expand navigator" : "Collapse navigator"}
          data-action="toggle-navigator"
        >
          {leftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

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
        >
          <TabQueryContent />
        </div>
      </div>

      {/* Utility panel - right sidebar */}
      <div
        className="utility-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: rightSidebarOpen ? '300px' : '48px',
          height: '100vh',
          zIndex: 30,
          transition: 'width var(--transition-speed) var(--transition-timing)',
          backgroundColor: '#0A0A0A',
          borderLeft: '1px solid #232326',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        data-section="utility-panel"
      >
        <RightSidebar />
      </div>
    </div>
  );
}