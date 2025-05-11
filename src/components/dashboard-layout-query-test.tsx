"use client"

import { useState, useEffect } from 'react';
import { LogOut, Building, Users, Package } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { ThemedSidebarWrapper } from '@/components/themed-sidebar-wrapper';
import { TabsContainerThemed } from '@/components/tabs-container-themed';
import { TabQueryContentThemed } from '@/components/tab-query-content-themed';
import { SidenavThemeProvider, useAppTheme } from '@/providers/sidenav-theme-provider';

export default function DashboardLayoutQueryTest() {
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
    <SidenavThemeProvider>
      <div className="flex h-screen w-full bg-[#080809]">
        {/* Themed Sidebar with provider */}
        <div className="w-80 h-screen flex-shrink-0">
          <ThemedSidebarWrapper />
        </div>

        {/* Main content area with tabs and content - using themed styles */}
        <MainContentArea />
      </div>
    </SidenavThemeProvider>
  );
}

// Separate component for the main content area to use theme
function MainContentArea() {
  const theme = useAppTheme();

  return (
    <div className={theme.mainContent}>
      {/* Header with themed tabs */}
      <TabsContainerThemed />

      {/* Content area with TabQueryContent */}
      <div className={theme.contentArea}>
        <TabQueryContentThemed />
      </div>
    </div>
  );
}