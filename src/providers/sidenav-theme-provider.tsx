"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Define the theme variables
const theme = {
  // Colors
  accentPrimary: '#9333EA',
  accentSecondary: '#4361EE',
  bgBase: '#000000',
  bgSecondary: '#0D0D0D',
  bgTertiary: '#0A0A0A',
  bgComponent: '#0C0C0C',
  bgHover: '#121218',
  bgActive: '#0A0A0A',

  // Typography - Vercel Design System
  textPrimary: 'text-white/90',   // Primary text
  textSecondary: 'text-white/70', // Secondary text
  textTertiary: 'text-white/50',  // Tertiary text
  textDisabled: 'text-white/40',  // Disabled text
  textHeading: 'text-white/95',   // Headings

  fontBase: 'text-[14px] leading-[1.5] tracking-[-0.011em]',
  fontHeading: 'tracking-[-0.02em] leading-[1.3]',
  fontUI: 'text-[14px] leading-[1.4] tracking-[-0.006em]',

  // Classes
  sidenav: `
    bg-[#0A0A0A]
    shadow-md shadow-black/20
    border border-white/[0.03]
    border-t-[#0C0C0C]
    border-r-white/[0.05]
    rounded-lg
    m-6
    overflow-hidden
    h-[calc(100vh-3rem)]
    flex
    flex-col
    relative
  `,
  
  sidenavHeader: `
    bg-[#0C0C0C]
    h-12 px-6
    border-b border-white/[0.03]
    flex items-center
    gap-3
    shadow-[0_1px_0_rgba(0,0,0,0.1)]
    relative
    z-10
  `,
  
  sidenavLogo: `
    flex items-center 
    gap-3
  `,
  
  sidenavUser: `
    h-12 px-6
    border-b border-white/[0.05]
    flex justify-between items-center
  `,
  
  sidenavUserInfo: `
    text-[14px]
    tracking-[-0.011em]
    leading-[1.5]
    text-white/70
    font-normal
  `,
  
  sidenavLogout: `
    w-8 h-8
    rounded-[0.25rem]
    flex items-center justify-center
    bg-[#0C0C0C]
    border border-white/[0.02]
    text-white/80
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05)]
    transition-all duration-150 ease-in-out
    cursor-pointer
    hover:bg-[#121218]
    hover:border-white/[0.04]
    hover:text-white/90
    active:bg-[#0A0A0A]
    active:border-white/[0.02]
    active:text-white/75
    active:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.15)]
  `,
  
  sidenavSection: `
    pt-6 pb-4
    mx-0
  `,
  
  sidenavSectionHeader: `
    flex justify-between items-center
    mb-3
    px-6
  `,
  
  sidenavSectionTitle: `
    text-xs
    font-semibold
    uppercase
    text-white/60
    tracking-[-0.006em]
    letter-spacing-[0.05em]
    mb-0
  `,

  sidenavAddButton: `
    w-6 h-6
    rounded-[0.25rem]
    flex items-center justify-center
    bg-[#0C0C0C]
    border border-white/[0.02]
    text-white/80
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05)]
    transition-all duration-150 ease-in-out
    cursor-pointer
    hover:bg-[#121218]
    hover:border-white/[0.04]
    hover:text-white/90
    active:bg-[#0A0A0A]
    active:border-white/[0.02]
    active:text-white/75
    active:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.15)]
  `,
  
  sidenavMenu: `
    flex flex-col
    gap-1
    mt-2
    px-2
  `,
  
  sidenavItem: `
    flex items-center
    gap-2
    py-2 px-4
    my-0
    mx-0
    rounded-md
    text-white/70
    text-[14px]
    leading-[1.4]
    tracking-[-0.006em]
    font-medium
    transition-all duration-180 ease-out
    transform translate-z-0
    cursor-pointer
    relative
    overflow-hidden
    hover:bg-white/[0.04]
    hover:text-white/90
    hover:translate-y-[-1px]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[#9333EA]/40
    will-change-transform
    h-9
  `,

  sidenavItemActive: `
    bg-[#121212]
    text-white/95
    border-l-[3px] border-l-[#9333EA]
    pl-[calc(0.75rem-3px)]
    shadow-[0_2px_5px_rgba(0,0,0,0.15)]
    relative
    hover:translate-y-0
    hover:bg-[#121212]
    after:absolute
    after:content-[""]
    after:inset-0
    after:bg-gradient-to-r
    after:from-[#9333EA]/[0.03]
    after:to-transparent
    after:pointer-events-none
    transition-colors duration-300
  `,
  
  sidenavItemIcon: `
    w-4 h-4
    flex items-center justify-center
    flex-shrink-0
    relative
    opacity-75
    group-hover:opacity-100
    transition-opacity duration-150
  `,
  
  sidenavItemContent: `
    flex-1 
    flex justify-between items-center
  `,
  
  sidenavGroup: `
    mb-1
  `,
  
  sidenavGroupHeader: `
    flex items-center
    py-2 px-4
    my-0
    mx-0
    rounded-md
    cursor-pointer
    transition-all duration-180 ease-out
    hover:bg-white/[0.04]
    border-b border-white/[0.01]
    font-medium
    text-[14px]
    leading-[1.4]
    tracking-[-0.006em]
    text-white/70
    h-9
  `,
  
  sidenavGroupToggle: `
    w-4 h-4
    flex items-center justify-center
    text-white/60
    transition-all duration-200
    ease-[cubic-bezier(0.4,0,0.2,1)]
    opacity-60
    hover:opacity-100
  `,

  sidenavGroupToggleExpanded: `
    rotate-90
    text-white
    opacity-80
  `,
  
  sidenavGroupButton: `
    flex flex-1 
    items-center 
    gap-2
  `,
  
  sidenavGroupContent: `
    pl-6
    overflow-hidden
    transition-height duration-300 ease-in-out
  `,
  
  sidenavContent: `
    flex-1 
    overflow-y-auto 
    scrollbar-thin 
    scrollbar-thumb-[rgba(127,90,240,0.3)] 
    scrollbar-track-transparent
  `,
  
  sidenavEmpty: `
    py-6 
    text-center 
    text-white/70
  `,
  
  sidenavEmptyAction: `
    mt-4
    text-white/90
    bg-none
    border-none
    py-2 px-4
    rounded-md
    text-[0.85rem]
    cursor-pointer
    transition-all duration-300 ease-in-out
    hover:bg-white/[0.05]
    hover:-translate-y-0.5
  `,

  // Main content area styles
  mainContent: `
    flex flex-col
    flex-1
    m-6
    ml-0
    rounded-lg
    shadow-lg shadow-black/20
    border border-white/[0.02]
    overflow-hidden
    bg-[#0A0A0A]
    h-[calc(100vh-3rem)]
    relative
  `,

  // Tab bar styles
  tabsContainer: `
    bg-[#0C0C0C]
    border-b border-white/[0.02]
    shadow-md shadow-black/20
    relative
    z-10
    rounded-t-lg
    h-12
  `,

  tabsList: `
    flex h-12 w-full
    rounded-none
    bg-transparent
    px-6
    items-center
  `,

  tabItem: `
    relative group flex-shrink-0
    min-w-[140px] max-w-[200px]
    border-r border-white/[0.05]
    overflow-hidden
    shadow-inner shadow-black/5
  `,

  tabTrigger: `
    w-full px-4 pr-8 h-10
    flex items-center justify-start
    text-[14px] text-white/70
    transition-all duration-300 ease-in-out
    hover:bg-[#121218]
    hover:text-white/95
    data-[state=active]:bg-[#121218]
    data-[state=active]:text-white/95
    data-[state=active]:border-l-[3px] data-[state=active]:border-l-[#9333EA]
    data-[state=active]:pl-[calc(1rem-3px)]
    tracking-[-0.006em]
    leading-[1.4]
  `,

  tabIcon: `
    h-4 w-4
    mr-1.5
    text-white/50
    flex-shrink-0
  `,

  tabEditButton: `
    absolute left-[calc(100%-24px-20px)] top-1/2 -translate-y-1/2
    rounded-sm p-0.5
    opacity-0 hover:opacity-100 group-hover:opacity-50
    transition-all duration-300 ease-in-out
    hover:bg-white/[0.1]
    hover:text-white
    hover:-translate-y-0.5
  `,

  tabCloseButton: `
    absolute right-2 top-1/2 -translate-y-1/2
    rounded-sm p-0.5
    hover:bg-white/[0.1]
    opacity-0 group-hover:opacity-100
    transition-all duration-300 ease-in-out
    hover:text-white
    hover:-translate-y-0.5
  `,

  tabInput: `
    text-sm text-white/95
    bg-[rgba(35,35,40,0.8)]
    border border-[#9333EA]/20
    focus:border-[#9333EA]
    shadow-inner
    rounded-md
    h-8
  `,

  tabFiller: `
    flex-1
    bg-[#0a0a10]
    shadow-inner shadow-black/10
  `,

  // Content area style
  contentArea: `
    flex-1
    overflow-auto
    bg-[#0A0A0A]
    scrollbar-thin
    scrollbar-thumb-white/20
    scrollbar-track-transparent
    p-6
    text-white/90
  `,

  // Action bar styles
  actionBar: `
    flex
    gap-3
    py-4
    mb-8
  `,

  // Button styles - professional refinements
  buttonPrimary: `
    bg-[#0C0C0C]
    text-white/80
    py-[0.4rem] px-[0.875rem]
    rounded-[0.25rem]
    text-[0.8125rem]
    font-medium
    letter-spacing-[0.01em]
    border border-white/[0.02]
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05)]
    transition-all duration-150 ease-in-out
    transform translate-z-0
    hover:bg-[#121218]
    hover:border-white/[0.04]
    hover:text-white/90
    active:bg-[#0A0A0A]
    active:border-white/[0.02]
    active:text-white/75
    active:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.15)]
    focus-visible:outline-none
    focus-visible:ring-1
    focus-visible:ring-[#9333EA]/30
    focus-visible:ring-offset-0
    will-change-auto
    flex items-center gap-2
    h-[2rem]
  `,

  buttonSecondary: `
    bg-[#0C0C0C]
    text-white/70
    py-[0.4rem] px-[0.875rem]
    rounded-[0.25rem]
    text-[0.8125rem]
    font-medium
    letter-spacing-[0.01em]
    border border-white/[0.02]
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)]
    transition-all duration-150 ease-in-out
    transform translate-z-0
    hover:bg-[#121218]
    hover:border-white/[0.04]
    hover:text-white/80
    active:bg-[#0A0A0A]
    active:border-white/[0.02]
    active:text-white/65
    active:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.15)]
    focus-visible:outline-none
    focus-visible:ring-1
    focus-visible:ring-white/20
    focus-visible:ring-offset-0
    will-change-auto
    flex items-center gap-2
    h-[2rem]
  `,

  buttonDanger: `
    bg-[#0C0C0C]
    text-[#F87171]/80
    py-[0.4rem] px-[0.875rem]
    rounded-[0.25rem]
    text-[0.8125rem]
    font-medium
    letter-spacing-[0.01em]
    border border-white/[0.02]
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.03)]
    transition-all duration-150 ease-in-out
    transform translate-z-0
    hover:bg-[#121218]
    hover:border-white/[0.04]
    hover:text-[#F87171]/90
    active:bg-[#0A0A0A]
    active:border-white/[0.02]
    active:text-white/70
    active:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.15)]
    focus-visible:outline-none
    focus-visible:ring-1
    focus-visible:ring-red-900/40
    focus-visible:ring-offset-0
    will-change-auto
    flex items-center gap-2
    h-[2rem]
  `,

  buttonDisabled: `
    bg-[#0A0A0A]
    text-white/20
    py-[0.4rem] px-[0.875rem]
    rounded-[0.25rem]
    text-[0.8125rem]
    font-medium
    letter-spacing-[0.01em]
    border border-white/[0.02]
    cursor-not-allowed
    opacity-90
    transition-none
    flex items-center gap-2
    h-[2rem]
  `,

  buttonIcon: `
    w-4 h-4
    flex items-center justify-center
    flex-shrink-0
    relative
    opacity-80
    group-hover:opacity-100
    transition-opacity duration-150
    -ml-0.5
  `,

  // Card styles
  card: `
    bg-[#0A0A0A]
    border-0
    shadow-sm shadow-black/10
    flex flex-col
    gap-0
    py-0
    rounded-md
    overflow-hidden
  `,

  cardContent: `
    bg-[#0A0A0A]
    p-0
    flex-grow
  `,

  // Form control styles
  input: `
    w-full
    bg-[#0C0C0C]
    border border-white/[0.02]
    text-white/80
    text-[0.8125rem]
    font-medium
    rounded-[0.25rem]
    px-3
    py-2
    h-9
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05)]
    focus:outline-none
    focus:ring-0
    focus:border-white/[0.04]
    focus:bg-[#121218]
    placeholder:text-white/50
    transition-all duration-150 ease-in-out
    hover:bg-[#121218]
    hover:border-white/[0.04]
    hover:text-white/90
  `,

  select: `
    w-full
    bg-[#0C0C0C]
    border border-white/[0.02]
    text-white/80
    text-[0.8125rem]
    font-medium
    rounded-[0.25rem]
    px-3
    py-2
    h-9
    focus:outline-none
    focus:ring-0
    focus:border-white/[0.04]
    focus:bg-[#121218]
    transition-all duration-150 ease-in-out
  `,

  selectTrigger: `
    bg-[#0C0C0C]
    border border-white/[0.02]
    text-white/80
    rounded-[0.25rem]
    h-9
    px-3
    text-[0.8125rem]
    font-medium
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05)]
    transition-all duration-150 ease-in-out
    data-[placeholder]:text-white/50
    focus:outline-none
    focus:ring-0
    focus:border-white/[0.04]
    focus:bg-[#121218]
    hover:bg-[#121218]
    hover:border-white/[0.04]
    hover:text-white/90
  `,

  selectContent: `
    bg-[#0F0F0F]
    border border-white/[0.03]
    rounded-md
    shadow-md
    py-1
    overflow-hidden
  `,

  selectItem: `
    text-white/80
    py-1.5
    px-3
    text-[0.8125rem]
    cursor-pointer
    hover:bg-[#121218]
    focus:bg-[#121218]
    transition-colors
    data-[highlighted]:bg-[#121218]
    data-[highlighted]:text-white
    outline-none
  `,

  editor: `
    bg-[#0C0C0C]
    border border-white/[0.02]
    rounded-[0.25rem]
    text-white/80
    overflow-hidden
    min-h-[150px]
    shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.05)]
    transition-all duration-150 ease-in-out
    hover:border-white/[0.04]
  `,

  editorToolbar: `
    bg-[#0C0C0C]
    border-b border-white/[0.02]
    p-2
    flex
    flex-wrap
    gap-1
  `,

  editorContent: `
    bg-[#0C0C0C]
    p-3
    min-h-[120px]
  `,
};

// Create a context for the theme
const ThemeContext = createContext(theme);

// Custom hook to use the theme
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

// For backward compatibility
export const useSidenavTheme = useAppTheme;

// Provider component
export function SidenavThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}