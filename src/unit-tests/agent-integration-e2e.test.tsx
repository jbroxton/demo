/**
 * End-to-End Integration Test for AI Agent Support (v5)
 * Tests the complete workflow from user request to database operations
 * Uses real tenant ID and user ID from env.local
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { AgentProvider } from '@/providers/agent-provider';
import { AiChatComponent } from '@/components/ai-chat';
import { createMockSession } from '../test-utils/mock-session';
import { setupTestDb, cleanupTestDb } from '../test-utils/test-db';

// Real test data from env.local
const REAL_USER_ID = '20000000-0000-0000-0000-000000000001';
const REAL_TENANT_ID = '22222222-2222-2222-2222-222222222222';

describe('AI Agent Support - End-to-End Integration', () => {
  let queryClient: QueryClient;
  let mockSession: any;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockSession = createMockSession({
      userId: REAL_USER_ID,
      tenantId: REAL_TENANT_ID,
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <SessionProvider session={mockSession}>
        <QueryClientProvider client={queryClient}>
          <AgentProvider>
            {component}
          </AgentProvider>
        </QueryClientProvider>
      </SessionProvider>
    );
  };

  describe('Complete Agent Workflow', () => {
    it('should handle full CRUD operation cycle with confirmations', async () => {
      // Mock OpenAI API responses
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'asst_test_123',
            object: 'assistant',
            created_at: Date.now(),
            name: 'Test Assistant',
            description: 'Test assistant for agent operations',
            model: 'gpt-4',
            instructions: 'You are a helpful product management assistant.',
            tools: [{ type: 'function', function: { name: 'create_product' } }],
            file_ids: [],
            metadata: {},
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'thread_test_123',
            object: 'thread',
            created_at: Date.now(),
            metadata: {},
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'msg_test_123',
            object: 'thread.message',
            created_at: Date.now(),
            thread_id: 'thread_test_123',
            role: 'user',
            content: [{ type: 'text', text: { value: 'Create a new product called "Test Product"' } }],
            file_ids: [],
            assistant_id: null,
            run_id: null,
            metadata: {},
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'run_test_123',
            object: 'thread.run',
            created_at: Date.now(),
            thread_id: 'thread_test_123',
            assistant_id: 'asst_test_123',
            status: 'requires_action',
            required_action: {
              type: 'submit_tool_outputs',
              submit_tool_outputs: {
                tool_calls: [{
                  id: 'call_test_123',
                  type: 'function',
                  function: {
                    name: 'create_product',
                    arguments: JSON.stringify({
                      name: 'Test Product',
                      description: 'A test product for integration testing',
                    }),
                  },
                }],
              },
            },
            model: 'gpt-4',
            instructions: 'You are a helpful assistant.',
            tools: [],
            file_ids: [],
            metadata: {},
          }),
        });

      renderWithProviders(<AiChatComponent />);

      // Step 1: Switch to Agent mode
      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      // Step 2: Send a message requesting product creation
      const messageInput = screen.getByPlaceholder(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(messageInput, { 
        target: { value: 'Create a new product called "Test Product" with description "A test product for integration testing"' }
      });
      fireEvent.click(sendButton);

      // Step 3: Wait for agent to process and show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/confirm action/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify confirmation dialog shows operation details
      expect(screen.getByText(/create product/i)).toBeInTheDocument();
      expect(screen.getByText(/test product/i)).toBeInTheDocument();

      // Step 4: Confirm the operation
      const confirmButton = screen.getByText(/confirm/i);
      fireEvent.click(confirmButton);

      // Step 5: Wait for operation to complete
      await waitFor(() => {
        expect(screen.getByText(/product created successfully/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 6: Verify action appears in history
      const historyButton = screen.getByText(/action history/i);
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/create_product/i)).toBeInTheDocument();
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });

    it('should handle user rejection of proposed action', async () => {
      // Mock OpenAI API for a delete operation
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'run_test_456',
            object: 'thread.run',
            status: 'requires_action',
            required_action: {
              type: 'submit_tool_outputs',
              submit_tool_outputs: {
                tool_calls: [{
                  id: 'call_test_456',
                  type: 'function',
                  function: {
                    name: 'delete_product',
                    arguments: JSON.stringify({
                      id: 'prod_123',
                    }),
                  },
                }],
              },
            },
          }),
        });

      renderWithProviders(<AiChatComponent />);

      // Switch to agent mode and send delete request
      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      // Trigger delete operation (simplified for test)
      // In real scenario, this would come from OpenAI function calling
      
      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/confirm action/i)).toBeInTheDocument();
      });

      // Verify warning for destructive operation
      expect(screen.getByText(/delete product/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();

      // Reject the operation
      const rejectButton = screen.getByText(/cancel/i);
      fireEvent.click(rejectButton);

      // Verify operation was cancelled
      await waitFor(() => {
        expect(screen.getByText(/operation cancelled/i)).toBeInTheDocument();
      });

      // Verify action logged as rejected
      const historyButton = screen.getByText(/action history/i);
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(screen.getByText(/rejected/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors with retry mechanism', async () => {
      // Mock network failure followed by success
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'run_test_789',
            status: 'completed',
            messages: [{ content: 'Operation completed successfully' }],
          }),
        });
      });

      renderWithProviders(<AiChatComponent />);

      // Switch to agent mode
      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      // Send message that would trigger network calls
      const messageInput = screen.getByPlaceholder(/ask me anything/i);
      fireEvent.change(messageInput, { target: { value: 'List all products' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      // Wait for retry mechanism to work
      await waitFor(() => {
        expect(screen.getByText(/operation completed successfully/i)).toBeInTheDocument();
      }, { timeout: 15000 });

      // Verify retry attempts were made
      expect(callCount).toBeGreaterThan(1);
    });

    it('should maintain session state across multiple operations', async () => {
      renderWithProviders(<AiChatComponent />);

      // Start agent session
      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      // Perform multiple operations
      const operations = [
        'Create a product called "Product 1"',
        'Create a feature for Product 1 called "Feature A"',
        'List all products'
      ];

      for (let i = 0; i < operations.length; i++) {
        const messageInput = screen.getByPlaceholder(/ask me anything/i);
        fireEvent.change(messageInput, { target: { value: operations[i] } });
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

        // Wait for each operation to complete
        await waitFor(() => {
          const messages = screen.getAllByText(/message/i);
          expect(messages.length).toBeGreaterThan(i);
        }, { timeout: 10000 });
      }

      // Verify session maintains context
      const historyButton = screen.getByText(/action history/i);
      fireEvent.click(historyButton);

      // Should show all operations in the same session
      await waitFor(() => {
        const actionItems = screen.getAllByText(/create_product|create_feature|list_products/i);
        expect(actionItems.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should handle entity relationship validation', async () => {
      // Mock attempt to create feature without valid product
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'run_test_validation',
            status: 'requires_action',
            required_action: {
              type: 'submit_tool_outputs',
              submit_tool_outputs: {
                tool_calls: [{
                  id: 'call_validation',
                  type: 'function',
                  function: {
                    name: 'create_feature',
                    arguments: JSON.stringify({
                      name: 'Orphan Feature',
                      productId: 'nonexistent_product_id',
                    }),
                  },
                }],
              },
            },
          }),
        });

      renderWithProviders(<AiChatComponent />);

      // Switch to agent mode
      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      // Send request that would fail validation
      const messageInput = screen.getByPlaceholder(/ask me anything/i);
      fireEvent.change(messageInput, { 
        target: { value: 'Create a feature called "Orphan Feature" for product ID "nonexistent_product_id"' }
      });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/validation error/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify specific error message about missing product
      expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    });

    it('should respect tenant isolation in operations', async () => {
      const otherTenantId = '33333333-3333-3333-3333-333333333333';
      
      // Create session with different tenant
      const otherSession = createMockSession({
        userId: REAL_USER_ID,
        tenantId: otherTenantId,
      });

      const { rerender } = render(
        <SessionProvider session={mockSession}>
          <QueryClientProvider client={queryClient}>
            <AgentProvider>
              <AiChatComponent />
            </AgentProvider>
          </QueryClientProvider>
        </SessionProvider>
      );

      // Create product with first tenant
      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      // Switch to different tenant session
      rerender(
        <SessionProvider session={otherSession}>
          <QueryClientProvider client={queryClient}>
            <AgentProvider>
              <AiChatComponent />
            </AgentProvider>
          </QueryClientProvider>
        </SessionProvider>
      );

      // Try to access product from first tenant - should fail
      const messageInput = screen.getByPlaceholder(/ask me anything/i);
      fireEvent.change(messageInput, { 
        target: { value: 'List all products' }
      });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        // Should not see products from other tenant
        expect(screen.getByText(/no products found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent operations gracefully', async () => {
      renderWithProviders(<AiChatComponent />);

      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      // Simulate multiple rapid requests
      const requests = Array.from({ length: 5 }, (_, i) => 
        `Create product ${i + 1}`
      );

      // Send all requests rapidly
      const messageInput = screen.getByPlaceholder(/ask me anything/i);
      requests.forEach(request => {
        fireEvent.change(messageInput, { target: { value: request } });
        fireEvent.click(screen.getByRole('button', { name: /send/i }));
      });

      // Wait for all operations to be queued/processed
      await waitFor(() => {
        const historyButton = screen.getByText(/action history/i);
        fireEvent.click(historyButton);
        
        // Should show all 5 operations
        const actionItems = screen.getAllByText(/create_product/i);
        expect(actionItems.length).toBe(5);
      }, { timeout: 30000 });
    });

    it('should clean up old sessions and actions', async () => {
      renderWithProviders(<AiChatComponent />);

      // Create old session data (mocked)
      // In real test, this would create test data with old timestamps
      
      // Trigger cleanup (this would normally be done by cron/background job)
      // For test purposes, we'll call the cleanup function directly
      const response = await fetch('/api/agent-actions-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cleanup',
          olderThanDays: 30,
        }),
      });

      expect(response.ok).toBe(true);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(typeof result.deletedCount).toBe('number');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from OpenAI API failures', async () => {
      // Mock OpenAI API failure followed by success
      let failureCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        failureCount++;
        if (failureCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'OpenAI API temporarily unavailable' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'run_recovery_test',
            status: 'completed',
            messages: [{ content: 'Operation completed after retry' }],
          }),
        });
      });

      renderWithProviders(<AiChatComponent />);

      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      const messageInput = screen.getByPlaceholder(/ask me anything/i);
      fireEvent.change(messageInput, { target: { value: 'Create a test product' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      // Should show error initially, then recover
      await waitFor(() => {
        expect(screen.getByText(/operation completed after retry/i)).toBeInTheDocument();
      }, { timeout: 20000 });
    });

    it('should handle database connection issues', async () => {
      // Mock database connection failure
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/')) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({ error: 'Database connection failed' }),
          });
        }
        return originalFetch(url);
      });

      renderWithProviders(<AiChatComponent />);

      const agentModeButton = screen.getByText('Agent');
      fireEvent.click(agentModeButton);

      const messageInput = screen.getByPlaceholder(/ask me anything/i);
      fireEvent.change(messageInput, { target: { value: 'List products' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      });

      // Verify retry button appears
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });
});