'use client';

import { ChevronRight, MessageSquare, CheckSquare } from 'lucide-react';
import { useUIState } from '@/providers/ui-state-provider';

export function RightSidebar() {
  const { rightSidebarOpen, toggleRightSidebar, activeRightTab, setActiveRightTab, setRightSidebarOpen } = useUIState();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-[#232326] p-3 flex flex-row lg:flex-col items-center gap-4">
        <button
          className={`flex items-center gap-2 p-2 rounded-md ${
            activeRightTab === 'chat' ? 'bg-[#121218] text-white' : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'
          }`}
          onClick={() => {
            setActiveRightTab('chat');
            if (!rightSidebarOpen) setRightSidebarOpen(true);
          }}
        >
          {rightSidebarOpen ? (
            <>
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Chat</span>
            </>
          ) : (
            <MessageSquare className="h-5 w-5" />
          )}
        </button>

        <button
          className={`flex items-center gap-2 p-2 rounded-md ${
            activeRightTab === 'todo' ? 'bg-[#121218] text-white' : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'
          }`}
          onClick={() => {
            setActiveRightTab('todo');
            if (!rightSidebarOpen) setRightSidebarOpen(true);
          }}
        >
          {rightSidebarOpen ? (
            <>
              <CheckSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">TODO</span>
            </>
          ) : (
            <CheckSquare className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Content Panel */}
      <div className={`p-4 overflow-y-auto flex-grow ${rightSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
        {activeRightTab === 'chat' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90 truncate">Chat</h2>
            <p className="text-white/70 text-sm break-words">
              Chat functionality placeholder. This is a longer text that should wrap properly within the sidebar width.
            </p>
          </div>
        )}

        {activeRightTab === 'todo' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90 truncate">TODO</h2>
            <p className="text-white/70 text-sm break-words">
              TODO list placeholder. This text demonstrates proper wrapping behavior in the sidebar.
            </p>
          </div>
        )}
      </div>

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