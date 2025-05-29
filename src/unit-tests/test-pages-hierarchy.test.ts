// Test pages hierarchy functionality
import { describe, it, expect } from '@jest/globals';

// Mock data that matches what we saw in the database
const mockPages = [
  {
    id: '3cae60a0-6626-4650-adf9-eaadd889777a',
    title: 'Authentication Platform',
    type: 'project',
    parent_id: null,
    tenant_id: '22222222-2222-2222-2222-222222222222',
    properties: {},
    blocks: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '0899b2a2-6e4e-4210-9869-7ee13d3598ec',
    title: 'User Authentication',
    type: 'feature',
    parent_id: '3cae60a0-6626-4650-adf9-eaadd889777a',
    tenant_id: '22222222-2222-2222-2222-222222222222',
    properties: {},
    blocks: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '1bb46206-663a-4f0c-8189-8538a80c16d5',
    title: 'New Project',
    type: 'project',
    parent_id: '3cae60a0-6626-4650-adf9-eaadd889777a',
    tenant_id: '22222222-2222-2222-2222-222222222222',
    properties: {},
    blocks: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'ca65d02c-a60c-4bbd-b7cc-60a918428341',
    title: 'Complex Block Structure Test',
    type: 'feature',
    parent_id: null,
    tenant_id: '22222222-2222-2222-2222-222222222222',
    properties: {},
    blocks: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '479c145c-80de-4c8e-8bdc-54da10ca4865',
    title: 'New Feature',
    type: 'release',
    parent_id: 'ca65d02c-a60c-4bbd-b7cc-60a918428341',
    tenant_id: '22222222-2222-2222-2222-222222222222',
    properties: {},
    blocks: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Simulate the helper functions from the pages query hook
function getRootPages(pages: typeof mockPages) {
  return pages.filter(page => page.parent_id === null);
}

function getChildPages(pages: typeof mockPages, parentId: string) {
  return pages.filter(page => page.parent_id === parentId);
}

describe('Pages Hierarchy Logic', () => {
  it('should correctly identify root pages', () => {
    const rootPages = getRootPages(mockPages);
    
    console.log('Root pages found:', rootPages.map(p => p.title));
    
    expect(rootPages).toHaveLength(2);
    expect(rootPages.map(p => p.title)).toContain('Authentication Platform');
    expect(rootPages.map(p => p.title)).toContain('Complex Block Structure Test');
  });

  it('should correctly find child pages', () => {
    const authPlatformId = '3cae60a0-6626-4650-adf9-eaadd889777a';
    const complexTestId = 'ca65d02c-a60c-4bbd-b7cc-60a918428341';
    
    const authChildren = getChildPages(mockPages, authPlatformId);
    const complexChildren = getChildPages(mockPages, complexTestId);
    
    console.log('Auth Platform children:', authChildren.map(p => p.title));
    console.log('Complex Test children:', complexChildren.map(p => p.title));
    
    expect(authChildren).toHaveLength(2);
    expect(authChildren.map(p => p.title)).toContain('User Authentication');
    expect(authChildren.map(p => p.title)).toContain('New Project');
    
    expect(complexChildren).toHaveLength(1);
    expect(complexChildren.map(p => p.title)).toContain('New Feature');
  });

  it('should correctly determine if pages have children', () => {
    const rootPages = getRootPages(mockPages);
    
    rootPages.forEach(page => {
      const children = getChildPages(mockPages, page.id);
      const hasChildren = children && children.length > 0;
      
      console.log(`Page "${page.title}" has ${children.length} children (hasChildren: ${hasChildren})`);
      
      if (page.title === 'Authentication Platform') {
        expect(hasChildren).toBe(true);
        expect(children.length).toBe(2);
      }
      
      if (page.title === 'Complex Block Structure Test') {
        expect(hasChildren).toBe(true);
        expect(children.length).toBe(1);
      }
    });
  });

  it('should simulate the expansion logic', () => {
    const rootPages = getRootPages(mockPages);
    const expandedPages: Record<string, boolean> = {};
    
    // Simulate auto-expansion logic
    rootPages.forEach(page => {
      const children = getChildPages(mockPages, page.id);
      if (children && children.length > 0) {
        console.log(`Auto-expanding "${page.title}" with ${children.length} children`);
        expandedPages[page.id] = true;
      }
    });
    
    console.log('Final expanded state:', expandedPages);
    
    expect(Object.keys(expandedPages)).toHaveLength(2);
    expect(expandedPages['3cae60a0-6626-4650-adf9-eaadd889777a']).toBe(true);
    expect(expandedPages['ca65d02c-a60c-4bbd-b7cc-60a918428341']).toBe(true);
  });

  it('should simulate the rendering condition', () => {
    const rootPages = getRootPages(mockPages);
    const expandedPages = {
      '3cae60a0-6626-4650-adf9-eaadd889777a': true,
      'ca65d02c-a60c-4bbd-b7cc-60a918428341': true,
    };
    const collapsed = false;
    
    rootPages.forEach(page => {
      const childPages = getChildPages(mockPages, page.id);
      const hasChildren = childPages && childPages.length > 0;
      const isExpanded = expandedPages[page.id] || false;
      const shouldRenderChildren = hasChildren && !collapsed;
      
      console.log(`Page "${page.title}": hasChildren=${hasChildren}, collapsed=${collapsed}, shouldRender=${shouldRenderChildren}`);
      console.log(`  Children:`, childPages.map(c => c.title));
      
      if (page.title === 'Authentication Platform' || page.title === 'Complex Block Structure Test') {
        expect(shouldRenderChildren).toBe(true);
        expect(hasChildren).toBe(true);
        expect(childPages.length).toBeGreaterThan(0);
      }
    });
  });
});