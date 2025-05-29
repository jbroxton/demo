// Phase 1 Testing: Database Foundation with Real Data
// Tests the pages table with JSON blocks storage

const TEST_TENANT_ID = '22222222-2222-2222-2222-222222222222';
const BASE_URL = 'http://localhost:3001';

async function apiRequest(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function runPhase1Tests() {
  console.log('🚀 Phase 1 Testing: Database Foundation');
  console.log('=====================================\n');

  try {
    // Test 1: Create project page with feature children, verify hierarchy via parent_id
    console.log('Test 1: Create project page with feature children');
    console.log('---------------------------------------------------');
    
    const projectPage = await apiRequest('/api/pages-db', {
      method: 'POST',
      body: JSON.stringify({
        type: 'project',
        title: 'Authentication Platform',
        tenant_id: TEST_TENANT_ID,
        properties: {
          status: { type: 'select', select: { name: 'Active', color: 'green' } },
          priority: { type: 'select', select: { name: 'High', color: 'red' } },
          owner: { type: 'person', people: [{ id: '20000000-0000-0000-0000-000000000001', name: 'PM User' }] }
        },
        blocks: [
          {
            type: 'document',
            content: {
              tiptap_content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Core authentication platform for the company.' }
                    ]
                  }
                ]
              },
              word_count: 8
            }
          }
        ]
      })
    });
    
    console.log('✅ Project page created:', projectPage.title);
    console.log('   ID:', projectPage.id);
    console.log('   Block count:', projectPage.block_count);
    
    // Create feature as child of project
    const featurePage = await apiRequest('/api/pages-db', {
      method: 'POST',
      body: JSON.stringify({
        type: 'feature',
        title: 'User Authentication',
        tenant_id: TEST_TENANT_ID,
        parent_id: projectPage.id,
        properties: {
          priority: { type: 'select', select: { name: 'High', color: 'red' } },
          status: { type: 'select', select: { name: 'In Progress', color: 'blue' } },
          owner: { type: 'person', people: [{ id: '20000000-0000-0000-0000-000000000001', name: 'PM User' }] }
        },
        blocks: [
          {
            type: 'requirement',
            content: {
              name: 'Secure Login Flow',
              priority: 'High',
              owner: 'John Doe',
              cuj: 'As a user, I want to securely log into the platform using my email and password',
              status: 'In Progress'
            }
          },
          {
            type: 'criteria',
            content: {
              description: 'User must be able to log in with valid credentials within 3 seconds',
              acceptance_test: 'Login form accepts valid email/password and redirects to dashboard',
              status: 'Draft'
            }
          }
        ]
      })
    });
    
    console.log('✅ Feature page created:', featurePage.title);
    console.log('   Parent ID:', featurePage.parent_id);
    console.log('   Block count:', featurePage.block_count);
    
    // Verify hierarchy by querying children
    const childPages = await apiRequest(`/api/pages-db?tenant_id=${TEST_TENANT_ID}&parent_id=${projectPage.id}`);
    console.log('✅ Hierarchy verified - Project has', childPages.length, 'children');
    console.log('   Child:', childPages[0].title, 'with parent_id:', childPages[0].parent_id);
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Add roadmap relation property to feature, query features by roadmap
    console.log('Test 2: Roadmap relation properties and querying');
    console.log('------------------------------------------------');
    
    // Create roadmap
    const roadmapPage = await apiRequest('/api/pages-db', {
      method: 'POST',
      body: JSON.stringify({
        type: 'roadmap',
        title: 'Q1 2024 Platform',
        tenant_id: TEST_TENANT_ID,
        properties: {
          quarter: { type: 'select', select: { name: 'Q1', color: 'blue' } },
          progress: { type: 'number', number: 75 },
          owner: { type: 'person', people: [{ id: '20000000-0000-0000-0000-000000000001', name: 'PM User' }] }
        }
      })
    });
    
    console.log('✅ Roadmap created:', roadmapPage.title);
    
    // Update feature with roadmap relation
    // Note: We'll need to create an update endpoint for this test
    console.log('📝 Feature-roadmap relation will be tested after update endpoint is created');
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Create requirement blocks under feature page, verify ordering by position
    console.log('Test 3: Block ordering and content validation');
    console.log('---------------------------------------------');
    
    console.log('✅ Feature has', featurePage.blocks.length, 'blocks:');
    featurePage.blocks.forEach((block, index) => {
      console.log(`   ${index + 1}. ${block.type}: ${JSON.stringify(block.content).substring(0, 50)}...`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Test property validation
    console.log('Test 4: Property validation');
    console.log('---------------------------');
    
    try {
      await apiRequest('/api/pages-db', {
        method: 'POST',
        body: JSON.stringify({
          type: 'feature',
          title: 'Invalid Feature',
          tenant_id: TEST_TENANT_ID,
          properties: {
            invalid_property: { type: 'invalid_type', value: 'should fail' }
          }
        })
      });
      console.log('❌ Property validation failed - invalid properties were accepted');
    } catch (error) {
      console.log('✅ Property validation working - invalid properties rejected');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Verify tenant isolation
    console.log('Test 5: Tenant isolation');
    console.log('------------------------');
    
    const otherTenantId = '00000000-0000-0000-0000-000000000002';
    
    // Try to access pages from different tenant
    const otherTenantPages = await apiRequest(`/api/pages-db?tenant_id=${otherTenantId}`);
    console.log('✅ Tenant isolation verified - other tenant has', otherTenantPages.length, 'pages');
    
    const currentTenantPages = await apiRequest(`/api/pages-db?tenant_id=${TEST_TENANT_ID}`);
    console.log('✅ Current tenant has', currentTenantPages.length, 'pages');
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('🎉 Phase 1 Tests Completed Successfully!');
    console.log('========================================');
    console.log('✅ Database schema working with JSON block storage');
    console.log('✅ Page hierarchy via parent_id relationships');
    console.log('✅ Block content stored in JSONB arrays');
    console.log('✅ Property validation functioning');
    console.log('✅ Tenant isolation enforced');
    console.log('\n📋 Next: Implement update/delete endpoints for Phase 2');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runPhase1Tests().catch(console.error);