import { test, expect } from '@playwright/test';

test.describe('Content Width Expansion Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to a page with content
    await page.goto('/dashboard');
    
    // Wait for layout to stabilize
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Allow any animations to complete
  });

  test('investigate content width expansion to right sidebar boundary', async ({ page }) => {
    console.log('=== CONTENT WIDTH EXPANSION INVESTIGATION ===');
    
    // Get viewport dimensions
    const viewportSize = page.viewportSize();
    console.log('Viewport size:', viewportSize);
    
    // Get all major layout containers
    const leftSidebar = page.locator('[data-testid="sidebar"]').first();
    const mainContent = page.locator('[data-testid="main-content"]').first();
    const rightSidebar = page.locator('[data-testid="right-sidebar"]').first();
    const canvasEditor = page.locator('[data-testid="canvas-editor"]').first();
    const contentHeading = page.locator('h1, h2, h3, .content-heading').first();
    
    // Check if elements exist
    const leftSidebarExists = await leftSidebar.count() > 0;
    const mainContentExists = await mainContent.count() > 0;
    const rightSidebarExists = await rightSidebar.count() > 0;
    const canvasEditorExists = await canvasEditor.count() > 0;
    const contentHeadingExists = await contentHeading.count() > 0;
    
    console.log('Elements found:');
    console.log('- Left sidebar:', leftSidebarExists);
    console.log('- Main content:', mainContentExists);
    console.log('- Right sidebar:', rightSidebarExists);
    console.log('- Canvas editor:', canvasEditorExists);
    console.log('- Content heading:', contentHeadingExists);
    
    // Test with right sidebar open (default state)
    console.log('\n=== RIGHT SIDEBAR OPEN STATE ===');
    
    if (rightSidebarExists) {
      const rightSidebarVisible = await rightSidebar.isVisible();
      console.log('Right sidebar visible:', rightSidebarVisible);
      
      if (rightSidebarVisible) {
        await testContentExpansion(page, 'with-right-sidebar');
      }
    }
    
    // Test with right sidebar closed
    console.log('\n=== RIGHT SIDEBAR CLOSED STATE ===');
    
    // Try to close right sidebar - look for toggle button
    const rightSidebarToggle = page.locator('[data-testid="right-sidebar-toggle"], [aria-label*="sidebar"], button:has-text("Close")').first();
    const toggleExists = await rightSidebarToggle.count() > 0;
    
    if (toggleExists) {
      console.log('Found right sidebar toggle, closing sidebar...');
      await rightSidebarToggle.click();
      await page.waitForTimeout(500); // Wait for animation
      
      await testContentExpansion(page, 'without-right-sidebar');
    } else {
      console.log('No right sidebar toggle found, testing current state...');
      await testContentExpansion(page, 'current-state');
    }
    
    // Additional CSS debugging
    await debugCSSConstraints(page);
  });

  test('measure actual vs expected content widths', async ({ page }) => {
    console.log('\n=== DETAILED WIDTH ANALYSIS ===');
    
    const measurements = await page.evaluate(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Find main layout containers
      const leftSidebar = document.querySelector('[data-testid="sidebar"]') as HTMLElement;
      const mainContent = document.querySelector('[data-testid="main-content"]') as HTMLElement;
      const rightSidebar = document.querySelector('[data-testid="right-sidebar"]') as HTMLElement;
      const canvasEditor = document.querySelector('[data-testid="canvas-editor"]') as HTMLElement;
      
      // Get computed styles and dimensions
      const getElementInfo = (element: HTMLElement | null, name: string) => {
        if (!element) return { name, exists: false };
        
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        
        return {
          name,
          exists: true,
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
          right: rect.right,
          computedWidth: styles.width,
          computedMaxWidth: styles.maxWidth,
          computedMinWidth: styles.minWidth,
          display: styles.display,
          position: styles.position,
          gridColumn: styles.gridColumn,
          gridRow: styles.gridRow,
          flexGrow: styles.flexGrow,
          flexShrink: styles.flexShrink,
          flexBasis: styles.flexBasis,
          margin: styles.margin,
          padding: styles.padding,
          overflow: styles.overflow,
          boxSizing: styles.boxSizing
        };
      };
      
      return {
        viewport,
        leftSidebar: getElementInfo(leftSidebar, 'Left Sidebar'),
        mainContent: getElementInfo(mainContent, 'Main Content'),
        rightSidebar: getElementInfo(rightSidebar, 'Right Sidebar'),
        canvasEditor: getElementInfo(canvasEditor, 'Canvas Editor')
      };
    });
    
    console.log('=== VIEWPORT ===');
    console.log(`Viewport: ${measurements.viewport.width}x${measurements.viewport.height}`);
    
    console.log('\n=== ELEMENT MEASUREMENTS ===');
    [measurements.leftSidebar, measurements.mainContent, measurements.rightSidebar, measurements.canvasEditor].forEach(element => {
      if (!element.exists) {
        console.log(`${element.name}: NOT FOUND`);
        return;
      }
      
      console.log(`\n${element.name}:`);
      console.log(`  Position: ${element.x}, ${element.y} (${element.width}x${element.height})`);
      console.log(`  Right edge: ${element.right}`);
      console.log(`  Computed width: ${element.computedWidth}`);
      console.log(`  Max width: ${element.computedMaxWidth}`);
      console.log(`  Min width: ${element.computedMinWidth}`);
      console.log(`  Display: ${element.display}`);
      console.log(`  Position: ${element.position}`);
      console.log(`  Grid column: ${element.gridColumn}`);
      console.log(`  Grid row: ${element.gridRow}`);
      console.log(`  Flex: ${element.flexGrow} ${element.flexShrink} ${element.flexBasis}`);
      console.log(`  Box sizing: ${element.boxSizing}`);
      console.log(`  Overflow: ${element.overflow}`);
    });
    
    // Calculate expected vs actual widths
    console.log('\n=== WIDTH ANALYSIS ===');
    
    const leftSidebarWidth = measurements.leftSidebar.exists ? measurements.leftSidebar.width : 0;
    const rightSidebarWidth = measurements.rightSidebar.exists && measurements.rightSidebar.width > 0 ? measurements.rightSidebar.width : 0;
    
    const expectedMainContentWidth = measurements.viewport.width - leftSidebarWidth - rightSidebarWidth;
    const actualMainContentWidth = measurements.mainContent.exists ? measurements.mainContent.width : 0;
    
    console.log(`Left sidebar width: ${leftSidebarWidth}px`);
    console.log(`Right sidebar width: ${rightSidebarWidth}px`);
    console.log(`Expected main content width: ${expectedMainContentWidth}px`);
    console.log(`Actual main content width: ${actualMainContentWidth}px`);
    console.log(`Width difference: ${expectedMainContentWidth - actualMainContentWidth}px`);
    
    if (measurements.canvasEditor.exists) {
      console.log(`Canvas editor width: ${measurements.canvasEditor.width}px`);
      console.log(`Canvas editor vs main content: ${measurements.canvasEditor.width - actualMainContentWidth}px difference`);
    }
    
    // Check if content is properly expanding
    const widthTolerance = 10; // Allow 10px tolerance
    if (Math.abs(expectedMainContentWidth - actualMainContentWidth) > widthTolerance) {
      console.log(`⚠️  ISSUE DETECTED: Content width not matching expected width (${Math.abs(expectedMainContentWidth - actualMainContentWidth)}px difference)`);
    } else {
      console.log(`✅ Content width appears correct`);
    }
  });

  test('analyze CSS Grid layout implementation', async ({ page }) => {
    console.log('\n=== CSS GRID ANALYSIS ===');
    
    const gridAnalysis = await page.evaluate(() => {
      // Find the main layout container (likely has CSS Grid)
      const possibleGridContainers = [
        document.querySelector('[data-testid="dashboard-layout"]'),
        document.querySelector('[data-testid="app-layout"]'),
        document.querySelector('.grid'),
        document.querySelector('main'),
        document.body.children[0] // Root app container
      ].filter(Boolean);
      
      const analyzeGridContainer = (element: Element, name: string) => {
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return {
          name,
          selector: element.tagName + (element.className ? '.' + element.className.split(' ').join('.') : ''),
          display: styles.display,
          gridTemplateColumns: styles.gridTemplateColumns,
          gridTemplateRows: styles.gridTemplateRows,
          gridTemplateAreas: styles.gridTemplateAreas,
          gap: styles.gap,
          gridGap: styles.gridGap,
          width: rect.width,
          height: rect.height,
          overflow: styles.overflow,
          children: Array.from(element.children).map(child => {
            const childStyles = window.getComputedStyle(child);
            const childRect = child.getBoundingClientRect();
            return {
              tagName: child.tagName,
              className: child.className,
              gridColumn: childStyles.gridColumn,
              gridRow: childStyles.gridRow,
              gridArea: childStyles.gridArea,
              width: childRect.width,
              height: childRect.height,
              display: childStyles.display
            };
          })
        };
      };
      
      return possibleGridContainers.map((container, index) => 
        analyzeGridContainer(container, `Container ${index + 1}`)
      );
    });
    
    gridAnalysis.forEach(container => {
      console.log(`\n=== ${container.name} (${container.selector}) ===`);
      console.log(`Display: ${container.display}`);
      console.log(`Grid template columns: ${container.gridTemplateColumns}`);
      console.log(`Grid template rows: ${container.gridTemplateRows}`);
      console.log(`Grid template areas: ${container.gridTemplateAreas}`);
      console.log(`Gap: ${container.gap}`);
      console.log(`Size: ${container.width}x${container.height}`);
      console.log(`Overflow: ${container.overflow}`);
      
      if (container.children.length > 0) {
        console.log('\nGrid children:');
        container.children.forEach((child, index) => {
          console.log(`  ${index + 1}. ${child.tagName}.${child.className}`);
          console.log(`     Grid column: ${child.gridColumn}`);
          console.log(`     Grid row: ${child.gridRow}`);
          console.log(`     Grid area: ${child.gridArea}`);
          console.log(`     Size: ${child.width}x${child.height}`);
          console.log(`     Display: ${child.display}`);
        });
      }
    });
  });

  test('test responsive behavior at different screen sizes', async ({ page }) => {
    console.log('\n=== RESPONSIVE BEHAVIOR TEST ===');
    
    const testSizes = [
      { name: 'Desktop Large', width: 1920, height: 1080 },
      { name: 'Desktop Standard', width: 1440, height: 900 },
      { name: 'Desktop Small', width: 1024, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const size of testSizes) {
      console.log(`\n=== Testing ${size.name} (${size.width}x${size.height}) ===`);
      
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      await testContentExpansion(page, size.name.toLowerCase().replace(' ', '-'));
    }
    
    // Reset to standard desktop size
    await page.setViewportSize({ width: 1440, height: 900 });
  });
});

// Helper function to test content expansion
async function testContentExpansion(page: any, testName: string) {
  console.log(`\n--- Content Expansion Test: ${testName} ---`);
  
  const measurements = await page.evaluate(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    
    const getRect = (selector: string) => {
      const element = document.querySelector(selector);
      return element ? element.getBoundingClientRect() : null;
    };
    
    const getStyle = (selector: string, property: string) => {
      const element = document.querySelector(selector);
      return element ? window.getComputedStyle(element).getPropertyValue(property) : null;
    };
    
    return {
      viewport,
      leftSidebar: getRect('[data-testid="sidebar"]'),
      mainContent: getRect('[data-testid="main-content"]'),
      rightSidebar: getRect('[data-testid="right-sidebar"]'),
      canvasEditor: getRect('[data-testid="canvas-editor"]'),
      contentHeading: getRect('h1, h2, h3, .content-heading'),
      // CSS constraints that might affect width
      mainContentMaxWidth: getStyle('[data-testid="main-content"]', 'max-width'),
      canvasEditorMaxWidth: getStyle('[data-testid="canvas-editor"]', 'max-width'),
      mainContentWidth: getStyle('[data-testid="main-content"]', 'width'),
      canvasEditorWidth: getStyle('[data-testid="canvas-editor"]', 'width')
    };
  });
  
  console.log('Viewport:', `${measurements.viewport.width}x${measurements.viewport.height}`);
  
  // Calculate available space
  const leftWidth = measurements.leftSidebar?.width || 0;
  const rightWidth = (measurements.rightSidebar?.width && measurements.rightSidebar.width > 50) ? measurements.rightSidebar.width : 0;
  const availableWidth = measurements.viewport.width - leftWidth - rightWidth;
  
  console.log(`Available content width: ${availableWidth}px`);
  console.log(`  - Viewport: ${measurements.viewport.width}px`);
  console.log(`  - Left sidebar: ${leftWidth}px`);
  console.log(`  - Right sidebar: ${rightWidth}px`);
  
  if (measurements.mainContent) {
    const mainContentWidth = measurements.mainContent.width;
    const widthUtilization = (mainContentWidth / availableWidth) * 100;
    
    console.log(`Main content actual width: ${mainContentWidth}px`);
    console.log(`Width utilization: ${widthUtilization.toFixed(1)}%`);
    console.log(`Main content CSS width: ${measurements.mainContentWidth}`);
    console.log(`Main content CSS max-width: ${measurements.mainContentMaxWidth}`);
    
    if (widthUtilization < 90) {
      console.log(`⚠️  ISSUE: Main content only using ${widthUtilization.toFixed(1)}% of available width`);
    }
  }
  
  if (measurements.canvasEditor) {
    const canvasWidth = measurements.canvasEditor.width;
    const canvasUtilization = (canvasWidth / availableWidth) * 100;
    
    console.log(`Canvas editor actual width: ${canvasWidth}px`);
    console.log(`Canvas width utilization: ${canvasUtilization.toFixed(1)}%`);
    console.log(`Canvas editor CSS width: ${measurements.canvasEditorWidth}`);
    console.log(`Canvas editor CSS max-width: ${measurements.canvasEditorMaxWidth}`);
    
    if (canvasUtilization < 90) {
      console.log(`⚠️  ISSUE: Canvas editor only using ${canvasUtilization.toFixed(1)}% of available width`);
    }
  }
  
  if (measurements.contentHeading) {
    const headingWidth = measurements.contentHeading.width;
    const headingUtilization = (headingWidth / availableWidth) * 100;
    
    console.log(`Content heading actual width: ${headingWidth}px`);
    console.log(`Heading width utilization: ${headingUtilization.toFixed(1)}%`);
    
    if (headingUtilization < 90) {
      console.log(`⚠️  ISSUE: Content heading only using ${headingUtilization.toFixed(1)}% of available width`);
    }
  }
}

// Helper function to debug CSS constraints
async function debugCSSConstraints(page: any) {
  console.log('\n=== CSS CONSTRAINTS ANALYSIS ===');
  
  const cssConstraints = await page.evaluate(() => {
    const selectors = [
      '[data-testid="main-content"]',
      '[data-testid="canvas-editor"]',
      'h1, h2, h3',
      '.content-heading',
      'main',
      '.container',
      '.max-w-',
      '[class*="max-w"]'
    ];
    
    const constraints: any[] = [];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        const constraintData = {
          selector: `${selector}[${index}]`,
          tagName: element.tagName,
          className: element.className,
          width: rect.width,
          computedWidth: styles.width,
          maxWidth: styles.maxWidth,
          minWidth: styles.minWidth,
          boxSizing: styles.boxSizing,
          margin: styles.margin,
          padding: styles.padding,
          overflow: styles.overflow,
          display: styles.display,
          position: styles.position
        };
        
        // Check for width-constraining classes
        const classList = Array.from(element.classList);
        const widthClasses = classList.filter(cls => 
          cls.includes('max-w') || 
          cls.includes('w-') || 
          cls.includes('container') ||
          cls.includes('mx-auto')
        );
        
        if (widthClasses.length > 0) {
          constraintData.widthClasses = widthClasses;
        }
        
        constraints.push(constraintData);
      });
    });
    
    return constraints;
  });
  
  cssConstraints.forEach(constraint => {
    console.log(`\n${constraint.selector} (${constraint.tagName})`);
    console.log(`  Class: ${constraint.className}`);
    console.log(`  Actual width: ${constraint.width}px`);
    console.log(`  Computed width: ${constraint.computedWidth}`);
    console.log(`  Max width: ${constraint.maxWidth}`);
    console.log(`  Min width: ${constraint.minWidth}`);
    console.log(`  Box sizing: ${constraint.boxSizing}`);
    console.log(`  Display: ${constraint.display}`);
    console.log(`  Position: ${constraint.position}`);
    console.log(`  Overflow: ${constraint.overflow}`);
    
    if (constraint.widthClasses) {
      console.log(`  Width classes: ${constraint.widthClasses.join(', ')}`);
    }
    
    // Flag potential issues
    if (constraint.maxWidth && constraint.maxWidth !== 'none') {
      console.log(`  ⚠️  Has max-width constraint: ${constraint.maxWidth}`);
    }
    
    if (constraint.overflow === 'hidden') {
      console.log(`  ⚠️  Has overflow hidden`);
    }
    
    if (constraint.widthClasses?.some((cls: string) => cls.includes('max-w'))) {
      console.log(`  ⚠️  Has Tailwind max-width classes`);
    }
  });
}