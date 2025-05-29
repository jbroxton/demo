'use client'

import * as React from 'react'
import { usePagesQuery } from '@/hooks/use-pages-query'
import { useTabsQuery } from '@/hooks/use-tabs-query'
import { getPageTypeIcon } from '@/utils/page-icons'
import { Page } from '@/types/models/Page' // Assuming Page type is available

interface PageChildrenRendererProps {
  parentId: string
  collapsed?: boolean // To pass down for consistent styling if needed
}

export function PageChildrenRenderer({ parentId, collapsed }: PageChildrenRendererProps) {
  const { pages: childPages = [], isLoading, error } = usePagesQuery({ parentId })
  const { openTab } = useTabsQuery()

  // TEMP DEBUG: Log what the component receives and fetches
  console.log(`👶 PageChildrenRenderer DEBUG: Fetching children for parentId: ${parentId}`)
  console.log(`👶 PageChildrenRenderer DEBUG: isLoading: ${isLoading}, error: ${error}, childPages count: ${childPages.length}`)
  if (childPages.length > 0) {
    console.log('👶 PageChildrenRenderer DEBUG: First child page:', childPages[0])
  }


  if (isLoading) {
    return <li className="ml-4 text-xs text-[#a0a0a0]">Loading children...</li>
  }

  if (error) {
    return <li className="ml-4 text-xs text-red-400">Error loading children.</li>
  }

  if (!childPages || childPages.length === 0) {
    return null // No children or finished loading with no children
  }

  return (
    <ul className="ml-4 mt-0.5 space-y-0.5" data-list="child-pages">
      {childPages.map((childPage: Page) => (
        <li key={childPage.id} className="group">
          <div className="flex items-center h-7" data-row="child-page">
            {/* Child page spacer - consistent with AppSidebarQuery */}
            {!collapsed && <div className="w-4 mr-0" />}
            
            <button
              className={`flex flex-1 items-center ${collapsed ? 'justify-center' : 'gap-1 pl-0 pr-1.5 py-0.5 text-left rounded hover:bg-white/10 transition-colors min-w-0'} text-sm text-[#e5e5e5] hover:text-white`}
              onClick={() => openTab({
                title: childPage.title,
                type: 'page', // Assuming childPage has a type, adjust if necessary
                itemId: childPage.id,
                hasChanges: false
              })}
              data-action="open-tab"
              data-entity-name={childPage.title}
              title={childPage.title}
            >
              {React.createElement(getPageTypeIcon(childPage.type), { 
                className: `${collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5 flex-shrink-0'} text-[#a0a0a0]`
              })}
              {!collapsed && <span className="truncate text-sm">{childPage.title}</span>}
            </button>
            {/* 
              Future: If these child pages can also have children, 
              you might need to recursively render <PageChildrenRenderer parentId={childPage.id} />
              or integrate grandchild fetching/rendering logic here or back in AppSidebarQuery.
              For now, this handles one level of children.
            */}
          </div>
        </li>
      ))}
    </ul>
  )
} 