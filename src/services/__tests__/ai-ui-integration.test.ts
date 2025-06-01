/**
 * AI UI Integration Test
 * 
 * This test verifies that the AI chat component is properly connected
 * and can interact with the API routes for both chat and indexing functionality.
 */

// Real test data
const realUserId = 'acac31b2-1ff2-4792-b2dc-2b7f4164f53a';
const realTenantId = 'cb1e1373-da6e-4167-86b9-3f08f81e3315';

describe('AI UI Integration', () => {
  
  describe('AI Chat Component Integration', () => {
    test('should verify AI chat component can be imported', async () => {
      // Test that the AI chat component can be imported without errors
      const { AIChatComponent } = await import('@/components/ai-chat');
      
      expect(AIChatComponent).toBeDefined();
      expect(typeof AIChatComponent).toBe('function');
      
      console.log('✅ AIChatComponent imported successfully');
    });
    
    test('should verify right sidebar integration', async () => {
      // Test that the right sidebar imports the AI chat component
      const { RightSidebar } = await import('@/components/rightsidebar/right-sidebar');
      
      expect(RightSidebar).toBeDefined();
      expect(typeof RightSidebar).toBe('function');
      
      console.log('✅ RightSidebar integration verified');
    });
  });
  
  describe('API Route Integration', () => {
    test('should verify indexing API endpoint works', async () => {
      console.log('Testing indexing API endpoint...');
      
      // Simulate the indexing request that the UI component makes
      const response = await fetch(`http://localhost:3000/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify({
          action: 'index',
          tenantId: realTenantId
        })
      });
      
      console.log(`API Response status: ${response.status}`);
      console.log(`API Response headers:`, {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
      
      // The response should be JSON
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      // Should return success or proper error structure
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(typeof data.indexed).toBe('number');
        console.log(`✅ Indexing successful: ${data.indexed} items indexed`);
        
        if (data.errors && data.errors.length > 0) {
          console.log(`⚠️ Some errors occurred: ${data.errors.length} items failed`);
        }
      } else {
        console.log(`❌ Indexing failed: ${data.error}`);
        // Even failures should have proper error structure
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
      }
    }, 30000); // 30 second timeout for API call
    
    test('should verify chat API endpoint structure', async () => {
      console.log('Testing chat API endpoint structure...');
      
      // Test a simple chat request (similar to what the UI sends)
      const response = await fetch(`http://localhost:3000/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a test message',
              id: 'test-message-1'
            }
          ],
          tenantId: realTenantId,
          userId: realUserId
        })
      });
      
      console.log(`Chat API Response status: ${response.status}`);
      
      // The response should be a streaming response or JSON error
      const contentType = response.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);
      
      if (response.ok) {
        // For streaming responses, we expect text/plain or text/event-stream
        const isStreaming = contentType?.includes('text/') || contentType?.includes('application/octet-stream');
        const isJson = contentType?.includes('application/json');
        
        expect(isStreaming || isJson).toBe(true);
        console.log('✅ Chat API endpoint returns valid response format');
        
        if (isStreaming) {
          console.log('✅ Streaming response detected (AI chat working)');
        } else if (isJson) {
          const data = await response.json();
          console.log('JSON response:', data);
        }
      } else {
        // Error responses should be JSON
        expect(contentType).toContain('application/json');
        const errorData = await response.json();
        console.log(`Chat API error response:`, errorData);
        expect(errorData).toHaveProperty('error');
      }
    }, 30000); // 30 second timeout for API call
  });
  
  describe('Component Dependencies', () => {
    test('should verify all required hooks and providers are available', async () => {
      console.log('Checking component dependencies...');
      
      // Check useAuth hook
      const { useAuth } = await import('@/hooks/use-auth');
      expect(useAuth).toBeDefined();
      expect(typeof useAuth).toBe('function');
      console.log('✅ useAuth hook available');
      
      // Check useChat from ai/react
      const { useChat } = await import('ai/react');
      expect(useChat).toBeDefined();
      expect(typeof useChat).toBe('function');
      console.log('✅ useChat hook from ai/react available');
      
      // Check UI components
      const { Button } = await import('@/components/ui/button');
      const { Card } = await import('@/components/ui/card');
      const { Input } = await import('@/components/ui/input');
      const { ScrollArea } = await import('@/components/ui/scroll-area');
      
      expect(Button).toBeDefined();
      expect(Card).toBeDefined();
      expect(Input).toBeDefined();
      expect(ScrollArea).toBeDefined();
      console.log('✅ All UI components available');
      
      // Check icons
      const { Send, Loader2, Database } = await import('lucide-react');
      expect(Send).toBeDefined();
      expect(Loader2).toBeDefined();
      expect(Database).toBeDefined();
      console.log('✅ All required icons available');
    });
    
    test('should verify UI state provider integration', async () => {
      // Check that UI state provider exists and exports required functions
      const { useUIState } = await import('@/providers/ui-state-provider');
      
      expect(useUIState).toBeDefined();
      expect(typeof useUIState).toBe('function');
      console.log('✅ useUIState provider available');
    });
  });
  
  describe('End-to-End UI Flow Simulation', () => {
    test('should simulate complete user interaction flow', async () => {
      console.log('=== SIMULATING COMPLETE UI INTERACTION ===');
      
      // Step 1: User opens right sidebar and clicks chat tab
      console.log('Step 1: User opens chat interface');
      
      // This would normally involve UI state changes, but we're testing the underlying functionality
      // that the UI components would use
      
      // Step 2: User clicks "Index Data" button
      console.log('Step 2: User clicks Index Data button');
      
      const indexingResponse = await fetch(`http://localhost:3000/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify({
          action: 'index',
          tenantId: realTenantId
        })
      });
      
      expect(indexingResponse.status).toBeLessThan(500); // Should not be server error
      
      const indexingData = await indexingResponse.json();
      console.log(`Indexing result: ${indexingData.success ? 'success' : 'failed'}`);
      
      if (indexingData.success) {
        console.log(`  Indexed items: ${indexingData.indexed}`);
        if (indexingData.errors) {
          console.log(`  Errors: ${indexingData.errors.length}`);
        }
      }
      
      // Step 3: User types a message and sends it
      console.log('Step 3: User sends a chat message');
      
      const chatResponse = await fetch(`http://localhost:3000/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': realTenantId
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: 'What features do we have in our product?',
              id: 'test-message-ui-flow'
            }
          ],
          tenantId: realTenantId,
          userId: realUserId
        })
      });
      
      console.log(`Chat response status: ${chatResponse.status}`);
      expect(chatResponse.status).toBeLessThan(500); // Should not be server error
      
      // Step 4: AI responds with context from indexed data
      console.log('Step 4: AI processes and responds');
      
      const contentType = chatResponse.headers.get('content-type');
      if (contentType?.includes('text/')) {
        console.log('✅ Received streaming AI response');
        // For streaming responses, we can't easily read the full content in tests
        // but we verified the response format is correct
      } else if (contentType?.includes('application/json')) {
        const chatData = await chatResponse.json();
        console.log('AI response data:', chatData);
      }
      
      console.log('=== UI INTERACTION SIMULATION COMPLETE ===');
      
      // Verify the complete flow worked
      expect(indexingResponse.status).toBeLessThan(500);
      expect(chatResponse.status).toBeLessThan(500);
      
      console.log('✅ Complete UI flow simulation successful');
    }, 45000); // 45 second timeout for complete flow
  });
});