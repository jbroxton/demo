'use client';

import { MessageSquare, CheckSquare, ChevronLeft } from 'lucide-react';
import { useUIState } from '@/providers/ui-state-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export function TabNavigation() {
  const { activeRightTab, setActiveRightTab, rightSidebarOpen, setRightSidebarOpen } = useUIState();

  // Show chat and todo icons when sidebar is closed
  if (!rightSidebarOpen) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`flex items-center justify-center p-2 rounded-md transition-colors duration-200 min-w-10 h-10 ${
                  activeRightTab === 'chat'
                    ? 'bg-[#121218] text-white'
                    : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'
                }`}
                onClick={() => {
                  setActiveRightTab('chat');
                  setRightSidebarOpen(true);
                }}
                aria-label="AI Chat"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1A1A1A] text-white/80">
              <p>AI Chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`flex items-center justify-center p-2 rounded-md transition-colors duration-200 min-w-10 h-10 ${
                  activeRightTab === 'todo'
                    ? 'bg-[#121218] text-white'
                    : 'text-white/50 hover:text-white/70 hover:bg-[#0F0F0F]'
                }`}
                onClick={() => {
                  setActiveRightTab('todo');
                  setRightSidebarOpen(true);
                }}
                aria-label="TODO"
              >
                <CheckSquare className="h-5 w-5" />
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

  // Show modern toggle when sidebar is open
  return (
    <div className="p-3 pr-12">
      {/* Clean Software-style Segmented Control */}
      <div className="flex bg-black/30 backdrop-blur-sm rounded-full p-0.5 border border-white/20 max-w-[200px]">
        <button
          onClick={() => setActiveRightTab('chat')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium flex-1 justify-center transition-all duration-200 ${
            activeRightTab === 'chat'
              ? 'bg-black/60 text-white border border-white/30'
              : 'text-white/60 hover:text-white/80 hover:bg-black/20'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          AI Chat
        </button>
        <button
          onClick={() => setActiveRightTab('todo')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium flex-1 justify-center transition-all duration-200 ${
            activeRightTab === 'todo'
              ? 'bg-black/60 text-white border border-white/30'
              : 'text-white/60 hover:text-white/80 hover:bg-black/20'
          }`}
        >
          <CheckSquare className="w-3 h-3" />
          TODO
        </button>
      </div>
    </div>
  );
}