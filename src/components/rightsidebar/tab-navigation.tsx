'use client';

import { MessageSquare, CheckSquare } from 'lucide-react';
import { useUIState } from '@/providers/ui-state-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export function TabNavigation() {
  const { activeRightTab, setActiveRightTab, rightSidebarOpen, setRightSidebarOpen } = useUIState();

  return (
    <div className="flex flex-row lg:flex-col justify-start items-center py-4 space-y-0 lg:space-y-4 space-x-4 lg:space-x-0 border-b border-[#232326] p-3"
    style={{
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`flex items-center justify-center p-2 rounded-md
                ${activeRightTab === 'chat'
                  ? 'bg-[#121218] text-white'
                  : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'}
                transition-colors duration-200 min-w-10 h-10`}
              onClick={() => {
                setActiveRightTab('chat');
                if (!rightSidebarOpen) {
                  setRightSidebarOpen(true);
                }
              }}
              aria-label="Chat"
            >
              {rightSidebarOpen ? (
                <div className="flex items-center w-full" style={{ maxWidth: '100%' }}>
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium truncate">Chat</span>
                </div>
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#1A1A1A] text-white/80">
            <p>Chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`flex items-center justify-center p-2 rounded-md
                ${activeRightTab === 'todo'
                  ? 'bg-[#121218] text-white'
                  : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'}
                transition-colors duration-200 min-w-10 h-10`}
              onClick={() => {
                setActiveRightTab('todo');
                if (!rightSidebarOpen) {
                  setRightSidebarOpen(true);
                }
              }}
              aria-label="TODO"
            >
              {rightSidebarOpen ? (
                <div className="flex items-center w-full" style={{ maxWidth: '100%' }}>
                  <CheckSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium truncate">TODO</span>
                </div>
              ) : (
                <CheckSquare className="h-5 w-5" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#1A1A1A] text-white/80">
            <p>TODO</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}