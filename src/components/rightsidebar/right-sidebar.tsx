'use client';

import { ChevronRight } from 'lucide-react';
import { useUIState } from '@/providers/ui-state-provider';
import { AIChatComponent } from '@/components/ai-chat';
import { ResizeHandle } from './resize-handle';
import { TabNavigation } from './tab-navigation';

export function RightSidebar() {
  const { rightSidebarOpen, toggleRightSidebar, activeRightTab } = useUIState();

  return (
    <div className="h-full flex flex-col overflow-hidden relative group">
      {/* Tab Navigation */}
      <TabNavigation />

      {/* Content Panel */}
      <div className={`flex-grow overflow-hidden w-full ${rightSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
        {activeRightTab === 'chat' && (
          <div className="w-full h-full">
            <AIChatComponent />
          </div>
        )}

        {activeRightTab === 'todo' && (
          <div className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-white/90 truncate">TODO</h2>
            <p className="text-white/70 text-sm break-words">
              TODO list placeholder. This text demonstrates proper wrapping behavior in the sidebar.
            </p>
          </div>
        )}
      </div>

      {/* Resize Handle - only show when sidebar is open */}
      {rightSidebarOpen && <ResizeHandle />}

      {/* Close Button */}
      {rightSidebarOpen && (
        <button
          className="absolute top-4 right-4 z-10 p-1 rounded-md bg-[#0F0F0F] hover:bg-[#1A1A1A] text-white/70 hover:text-white/90"
          onClick={toggleRightSidebar}
          aria-label="Close sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}