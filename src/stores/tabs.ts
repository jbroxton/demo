import { create } from 'zustand';

export interface Tab {
  id: string;
  title: string;
  type: 'feature' | 'product' | 'interface' | 'release';
  itemId: string;
}

interface TabsStore {
  tabs: Tab[];
  activeTabId: string | null;
  
  // Actions
  openTab: (tab: Omit<Tab, 'id'>) => void;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  getActiveTab: () => Tab | undefined;
}

export const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  
  openTab: (tabData) => {
    // Generate a unique ID for the tab
    const tabId = Math.random().toString(36).substring(2, 9);
    
    // Check if a tab with the same itemId and type already exists
    const existingTabIndex = get().tabs.findIndex(
      tab => tab.itemId === tabData.itemId && tab.type === tabData.type
    );
    
    if (existingTabIndex !== -1) {
      // If it exists, just activate it
      set({ activeTabId: get().tabs[existingTabIndex].id });
    } else {
      // Otherwise, create a new tab
      const newTab = { ...tabData, id: tabId };
      set((state) => ({
        tabs: [...state.tabs, newTab],
        activeTabId: tabId
      }));
    }
  },
  
  closeTab: (tabId) => {
    set((state) => {
      const newTabs = state.tabs.filter(tab => tab.id !== tabId);
      
      // If we're closing the active tab, activate another one
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === tabId) {
        newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }
      
      return {
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    });
  },
  
  activateTab: (tabId) => {
    set({ activeTabId: tabId });
  },
  
  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    if (!activeTabId) return undefined;
    return tabs.find(tab => tab.id === activeTabId);
  }
})); 