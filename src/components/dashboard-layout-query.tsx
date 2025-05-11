"use client"

import { useState, useEffect } from 'react';
import { AppSidebarQuery } from '@/components/app-sidebar-query';
import { LogOut, Building, Users, Package } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { TabQueryContent } from '@/components/tab-query-content';
import { TabsContainer } from '@/components/tabs-container';
import { useRouter } from 'next/navigation';

export default function DashboardLayoutQuery() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, currentTenant, allowedTenants, logout } = useAuth();

  // Redirect to login if not authenticated - direct redirect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // If not authenticated, don't render anything (redirect will happen)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Directly render the dashboard when authenticated
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
        <AppSidebarQuery />
      </div>
      
      {/* Main content area with tabs and content */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header with tabs */}
        <div className="flex-shrink-0 border-b border-[#232326] bg-[#0C0C0C]">
          <TabsContainer />
        </div>
        
        {/* Content area with TabQueryContent */}
        <div className="flex-1 overflow-auto bg-[#1e1e20] custom-scrollbar">
          <TabQueryContent />
        </div>
      </div>
    </div>
  );
}