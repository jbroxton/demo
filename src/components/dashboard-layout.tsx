import { AppSidebar } from '@/components/app-sidebar';
import { TabsContainer } from '@/components/tabs-container';
import { TabContent } from '@/components/tab-content';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar with independent scrolling and custom scrollbar styling */}
      <div 
        className="w-80 h-screen overflow-y-auto flex-shrink-0 border-r border-[#232326] bg-[#161618] custom-scrollbar"
        style={{
          /* Webkit browsers (Chrome, Safari, newer versions of Opera) */
          scrollbarWidth: 'thin',
          /* Firefox */
          scrollbarColor: 'rgba(80, 80, 80, 0.3) transparent',
        }}
      >
        <style jsx>{`
          /* Custom scrollbar for Webkit browsers */
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
        <AppSidebar />
      </div>
      
      {/* Main content area with independent scrolling */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header with tabs */}
        <div className="flex-shrink-0 border-b border-[#232326] bg-[#161618]">
          <TabsContainer />
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto bg-[#1e1e20] custom-scrollbar">
          <TabContent />
        </div>
      </div>
    </div>
  );
} 