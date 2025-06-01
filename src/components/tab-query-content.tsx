import { useTabsQuery } from '@/hooks/use-tabs-query';
import { FeatureQueryTabContent } from './feature-query-tab-content';
import { ProductQueryTabContent } from './product-query-tab-content';
import { InterfaceQueryTabContent } from './interface-query-tab-content';
import { ReleaseQueryTabContent } from './release-query-tab-content';
import { RoadmapQueryTabContent } from './roadmap-query-tab-content';
import { RoadmapSpecificTabContent } from './roadmap-specific-tab-content';
import { SettingsTabContent } from './settings-tab-content';
import { UnifiedPageEditor } from './unified-page-editor';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useUnifiedPages } from '@/providers/unified-state-provider';
import { useQuery } from '@tanstack/react-query';

export function TabQueryContent() {
  const { tabs, activeTabId, isLoading } = useTabsQuery();


  // If there are no tabs or no active tab, show a placeholder
  if (!tabs.length || !activeTabId) {
    return (
      <div
        className="flex items-center justify-center h-full p-6"
        data-component="canvas-content"
        data-state="empty"
        data-testid="pages-empty-editor"
      >
        <div className="text-center text-[#a0a0a0]">
          <h3 className="text-lg font-medium">No active canvas</h3>
          <p className="text-sm mt-2">Click on an item in the navigator to open it</p>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab) return null;

  let content;
  
  // Render content based on the active tab's type
  switch (activeTab.type) {
    case 'product': {
      // Since we don't have the product data here, pass the productId and let the component check isSaved
      content = <ProductQueryTabContent key={activeTab.itemId} productId={activeTab.itemId} tabId={activeTab.id} />;
      break;
    }
    case 'interface': {
      content = <InterfaceQueryTabContent
        key={activeTab.itemId}
        interfaceId={activeTab.itemId}
        tabId={activeTab.id}
      />;
      break;
    }
    case 'feature': {
      content = <FeatureQueryTabContent
        featureId={activeTab.itemId}
        tabId={activeTab.id}
      />;
      break;
    }
    case 'release': {
      content = <ReleaseQueryTabContent
        releaseId={activeTab.itemId}
        tabId={activeTab.id}
      />;
      break;
    }
    case 'roadmap': {
      // Check if this is the main roadmaps tab or a specific roadmap tab
      // Note: For group/list views, we use a placeholder UUID ('00000000-0000-0000-0000-000000000001')
      // instead of a string like 'roadmaps' because backend validation expects UUID-formatted itemIds.
      // We keep the check for 'roadmaps' for backward compatibility with existing tabs.
      if (activeTab.itemId === 'roadmaps' || activeTab.itemId === '00000000-0000-0000-0000-000000000001') {
        // This is the main roadmaps tab showing all roadmaps
        content = <RoadmapQueryTabContent tabId={activeTab.id} />;
      } else {
        // Check if this is a new roadmap tab
        const isNew = activeTab.itemId.startsWith('new-roadmap-');

        content = <RoadmapSpecificTabContent
          roadmapId={activeTab.itemId}
          tabId={activeTab.id}
          isNew={isNew}
        />;
      }
      break;
    }
    case 'settings': {
      content = <SettingsTabContent tabId={activeTab.id} />;
      break;
    }
    case 'page': {
      content = <UnifiedPageEditorWrapper pageId={activeTab.itemId} />;
      break;
    }
    default:
      content = <div className="text-[#a0a0a0]">Unknown item type (DB Version)</div>;
  }

  return (
    <div
      key={activeTab.itemId}
      className="bg-[#0A0A0A] h-full"
      data-component="canvas-content"
      data-content-type={activeTab.type}
      data-tab-id={activeTab.id}
    >
      <div className="canvas-editor-content" data-section="canvas-editor-content">
        {content}
      </div>
    </div>
  );
}

// Wrapper component for UnifiedPageEditor that uses same data source as sidebar/tabs
function UnifiedPageEditorWrapper({ pageId }: { pageId: string }) {
  const { deletePageMutation } = usePagesQuery();
  const { updateTabTitle, closeTab, tabs } = useTabsQuery();
  const unifiedPagesState = useUnifiedPages();
  
  // Try to get page from unified state first (for cached pages)
  const cachedPage = unifiedPagesState.getPageById(pageId);
  
  // If not found in cache, fetch it directly (for child pages not in main cache)
  const { data: individualPage, isLoading: individualLoading, error: individualError } = useQuery({
    queryKey: ['individual-page', pageId],
    queryFn: async () => {
      console.log(`🔍 Fetching individual page: ${pageId}`);
      const response = await fetch(`/api/pages-db?id=${pageId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Individual page fetched:`, result);
      return result.data || result;
    },
    enabled: !cachedPage, // Only fetch if not found in cache
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
  
  // Use cached page if available, otherwise use individually fetched page
  const page = cachedPage || individualPage;
  const isLoading = !cachedPage && individualLoading;
  const error = individualError || unifiedPagesState.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0A0A0A] rounded-lg">
        <div className="text-white/60">Loading page...</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0A0A0A] rounded-lg">
        <div className="text-red-400">Failed to load page</div>
      </div>
    );
  }

  const handleSave = async () => {
    // Save function will be called by the editor when content changes
    // The editor handles its own content saving through onChange
    console.log('Save triggered for page:', pageId);
  };

  const handleDelete = async () => {
    try {
      await unifiedPagesState.deletePage(pageId);
      
      // Close the tab for the deleted page
      const tabToClose = tabs.find(tab => tab.itemId === pageId);
      if (tabToClose) {
        await closeTab(tabToClose.id);
        console.log('Page deleted and tab closed:', pageId);
      } else {
        console.log('Page deleted:', pageId);
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  // Debug logging for roadmap pages
  if (page.type === 'roadmap') {
    console.log('🗺️ ROADMAP PAGE DEBUG:', {
      pageId: page.id,
      pageType: page.type,
      title: page.title,
      blocks: page.blocks,
      hasBlocks: page.blocks?.length > 0,
      blocksContent: page.blocks?.[0]?.content
    });
  }

  return (
    <UnifiedPageEditor
      pageId={page.id}
      pageType={page.type}
      initialTitle={page.title}
      initialContent={page.blocks}
      initialProperties={page.properties}
      onSave={handleSave}
      onDelete={handleDelete}
      persistenceKey={pageId}
    />
  );
}