// Simple test to check if child pages are rendering in the sidebar
// Run this in the browser console on localhost:3001

console.log('=== CHILD RENDERING TEST ===');

// 1. Check if pages exist in the DOM
const sidebarMenu = document.querySelector('[data-section="pages-tree"]');
console.log('Pages tree section found:', !!sidebarMenu);

if (sidebarMenu) {
  // 2. Count total pages in sidebar
  const pageButtons = sidebarMenu.querySelectorAll('[data-sidebar="menu-button"]');
  const subPageButtons = sidebarMenu.querySelectorAll('[data-sidebar="menu-sub-button"]');
  
  console.log('Root page buttons found:', pageButtons.length);
  console.log('Child page buttons found:', subPageButtons.length);
  
  // 3. Check for specific shadcn sidebar components
  const sidebarMenuItems = sidebarMenu.querySelectorAll('[data-sidebar="menu-item"]');
  const sidebarMenuSubs = sidebarMenu.querySelectorAll('[data-sidebar="menu-sub"]');
  const sidebarMenuSubItems = sidebarMenu.querySelectorAll('[data-sidebar="menu-sub-item"]');
  
  console.log('SidebarMenuItem components:', sidebarMenuItems.length);
  console.log('SidebarMenuSub components:', sidebarMenuSubs.length);
  console.log('SidebarMenuSubItem components:', sidebarMenuSubItems.length);
  
  // 4. Log the actual structure
  console.log('=== DOM STRUCTURE ===');
  sidebarMenuItems.forEach((item, index) => {
    const button = item.querySelector('[data-sidebar="menu-button"]');
    const subMenu = item.querySelector('[data-sidebar="menu-sub"]');
    const subItems = subMenu ? subMenu.querySelectorAll('[data-sidebar="menu-sub-item"]') : [];
    
    console.log(`Root page ${index + 1}:`, button?.textContent?.trim());
    if (subItems.length > 0) {
      console.log(`  Has ${subItems.length} children:`);
      subItems.forEach((subItem, subIndex) => {
        const subButton = subItem.querySelector('[data-sidebar="menu-sub-button"]');
        console.log(`    Child ${subIndex + 1}:`, subButton?.textContent?.trim());
      });
    } else {
      console.log('  No children found');
    }
  });
} else {
  console.log('Pages tree section not found in DOM');
}

// 5. Check React Query data (if accessible)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('=== REACT QUERY DEBUG ===');
  // Try to access React Query cache
  try {
    const reactFiber = document.querySelector('#__next')?._reactInternalFiber || 
                      document.querySelector('#__next')?._reactInternals;
    if (reactFiber) {
      console.log('React fiber found - check React DevTools for query cache');
    }
  } catch (e) {
    console.log('Could not access React internals');
  }
}

console.log('=== TEST COMPLETE ===');