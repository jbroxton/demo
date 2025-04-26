import { AppSidebar } from '@/components/app-sidebar';
import { TabsContainer } from '@/components/tabs-container';
import { TabContent } from '@/components/tab-content';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#161618]">
      <AppSidebar className="border-r border-[#232326]" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="z-10 h-12">
          <TabsContainer />
        </header>
        <main className="flex-1 overflow-auto bg-[#1e1e20]">
          <TabContent />
        </main>
      </div>
    </div>
  );
} 