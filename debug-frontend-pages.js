// Debug script to check what the frontend receives
async function testPagesAPI() {
  console.log('=== TESTING FRONTEND PAGES API ===');
  
  try {
    const response = await fetch('http://localhost:3001/api/pages-db', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error('API Response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    if (result.data) {
      console.log(`\nReceived ${result.data.length} pages from API`);
      
      // Check for parent-child relationships
      const rootPages = result.data.filter(p => !p.parent_id);
      console.log(`Root pages: ${rootPages.length}`);
      
      rootPages.forEach(rootPage => {
        const children = result.data.filter(p => p.parent_id === rootPage.id);
        if (children.length > 0) {
          console.log(`\n"${rootPage.title}" has ${children.length} children:`);
          children.forEach(child => {
            console.log(`  - "${child.title}"`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testPagesAPI();