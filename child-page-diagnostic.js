/**
 * Child Page Creation Diagnostic Script
 * 
 * This script helps diagnose child page creation issues by:
 * 1. Creating a parent page
 * 2. Creating a child page 
 * 3. Checking database state vs API responses
 * 4. Identifying mismatches in page types/content
 */

async function runDiagnostic() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 Starting Child Page Creation Diagnostic...\n');
  
  // Step 1: Create parent page
  console.log('📝 Step 1: Creating parent page...');
  const parentResponse = await fetch(`${baseUrl}/api/pages-db`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'feature',
      title: 'Diagnostic Parent Feature',
      properties: {},
      blocks: [
        {
          id: `doc-${Date.now()}`,
          type: 'document',
          content: {
            tiptap_content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'This is a parent feature for diagnostic testing.'
                    }
                  ]
                }
              ]
            }
          }
        }
      ]
    })
  });
  
  if (!parentResponse.ok) {
    console.error('❌ Failed to create parent page:', await parentResponse.text());
    return;
  }
  
  const parentPage = await parentResponse.json();
  console.log('✅ Parent page created:', parentPage);
  console.log(`   - ID: ${parentPage.id}`);
  console.log(`   - Type: ${parentPage.type}`);
  console.log(`   - Title: ${parentPage.title}\n`);
  
  // Step 2: Create child page
  console.log('📝 Step 2: Creating child page...');
  const childResponse = await fetch(`${baseUrl}/api/pages-db`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'feature',
      title: 'Diagnostic Child Feature',
      parent_id: parentPage.id,
      properties: {},
      blocks: [
        {
          id: `doc-${Date.now() + 1}`,
          type: 'document',
          content: {
            tiptap_content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'This is a child feature for diagnostic testing.'
                    }
                  ]
                }
              ]
            }
          }
        }
      ]
    })
  });
  
  if (!childResponse.ok) {
    console.error('❌ Failed to create child page:', await childResponse.text());
    return;
  }
  
  const childPage = await childResponse.json();
  console.log('✅ Child page created:', childPage);
  console.log(`   - ID: ${childPage.id}`);
  console.log(`   - Type: ${childPage.type}`);
  console.log(`   - Title: ${childPage.title}`);
  console.log(`   - Parent ID: ${childPage.parent_id}\n`);
  
  // Step 3: Fetch all pages to verify hierarchy
  console.log('🔍 Step 3: Fetching pages to verify hierarchy...');
  const pagesResponse = await fetch(`${baseUrl}/api/pages-db`);
  
  if (!pagesResponse.ok) {
    console.error('❌ Failed to fetch pages:', await pagesResponse.text());
    return;
  }
  
  const allPages = await pagesResponse.json();
  console.log('📊 All pages in database:');
  allPages.forEach(page => {
    const isParent = page.id === parentPage.id;
    const isChild = page.id === childPage.id;
    const prefix = isParent ? '🔸 PARENT:' : isChild ? '🔹 CHILD: ' : '   ';
    console.log(`${prefix} ${page.title} (ID: ${page.id}, Type: ${page.type}, Parent: ${page.parent_id || 'none'})`);
  });
  
  // Step 4: Fetch children of parent specifically
  console.log('\n🔍 Step 4: Fetching children of parent page...');
  const childrenResponse = await fetch(`${baseUrl}/api/pages-db?parent_id=${parentPage.id}`);
  
  if (!childrenResponse.ok) {
    console.error('❌ Failed to fetch children:', await childrenResponse.text());
    return;
  }
  
  const children = await childrenResponse.json();
  console.log(`📊 Children of parent "${parentPage.title}":`);
  if (children.length === 0) {
    console.log('⚠️  No children found!');
  } else {
    children.forEach(child => {
      console.log(`   - ${child.title} (ID: ${child.id}, Type: ${child.type})`);
      console.log(`     Content blocks: ${child.blocks?.length || 0}`);
      if (child.blocks?.length > 0) {
        console.log(`     First block type: ${child.blocks[0]?.type}`);
        console.log(`     Has TipTap content: ${!!child.blocks[0]?.content?.tiptap_content}`);
      }
    });
  }
  
  // Step 5: Verify individual child page fetch
  console.log('\n🔍 Step 5: Fetching child page individually...');
  const individualChildResponse = await fetch(`${baseUrl}/api/pages-db?id=${childPage.id}`);
  
  if (individualChildResponse.ok) {
    const individualChild = await individualChildResponse.json();
    console.log('✅ Individual child fetch successful');
    console.log(`   - Same ID: ${individualChild.id === childPage.id}`);
    console.log(`   - Same type: ${individualChild.type === childPage.type}`);
    console.log(`   - Has content: ${!!individualChild.blocks?.length}`);
  } else {
    console.error('❌ Failed to fetch individual child:', await individualChildResponse.text());
  }
  
  console.log('\n🏁 Diagnostic complete!');
  console.log('\n📋 Summary:');
  console.log(`   - Parent page created: ${parentPage.id} (${parentPage.type})`);
  console.log(`   - Child page created: ${childPage.id} (${childPage.type})`);
  console.log(`   - Parent-child relationship: ${childPage.parent_id === parentPage.id ? '✅ Correct' : '❌ Broken'}`);
  console.log(`   - Children query returns child: ${children.some(c => c.id === childPage.id) ? '✅ Yes' : '❌ No'}`);
}

// Run the diagnostic
runDiagnostic().catch(console.error);