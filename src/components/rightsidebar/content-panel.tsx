'use client';

import { useUIState } from '@/providers/ui-state-provider';

export function ContentPanel() {
  const { activeRightTab, rightSidebarOpen } = useUIState();

  return (
    <div
      className={`p-4 overflow-y-auto custom-scrollbar transition-opacity duration-200 ${
        rightSidebarOpen ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        width: '100%',
        maxWidth: '100%',
        flexGrow: 0,
        flexShrink: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'opacity 0.2s'
      }}
    >
      {activeRightTab === 'chat' && (
        <div className="space-y-4 w-full" style={{ maxWidth: '100%', paddingRight: '10px' }}>
          <h2 className="text-lg font-semibold text-white/90 truncate">Chat</h2>
          <p className="text-white/70 text-sm whitespace-normal" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', width: '100%' }}>
            Chat functionality placeholder. This is a longer text that should wrap properly within the sidebar width.
          </p>
        </div>
      )}

      {activeRightTab === 'todo' && (
        <div className="space-y-4 w-full" style={{ maxWidth: '100%', paddingRight: '10px' }}>
          <h2 className="text-lg font-semibold text-white/90 truncate">TODO</h2>
          <p className="text-white/70 text-sm whitespace-normal" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', width: '100%' }}>
            TODO list placeholder. This text demonstrates proper wrapping behavior in the sidebar.
          </p>
        </div>
      )}

      {/* Add custom scrollbar styles directly to component */}
      <style jsx global>{`
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
    </div>
  );
}