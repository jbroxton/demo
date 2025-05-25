/**
 * Unit Tests: Frontend Auto-Embedding Status UI
 * 
 * Tests the AI chat component's ability to display automatic embedding
 * status and handle real-time updates.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIChatComponent } from '@/components/ai-chat';
import * as aiService from '@/services/ai-service';

// Mock the AI service functions
jest.mock('@/services/ai-service', () => ({
  isAutoEmbeddingEnabled: jest.fn(),
  getEmbeddingQueueStatus: jest.fn(),
  triggerManualEmbeddingProcessing: jest.fn(),
}));

// Mock the auth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    currentTenant: 'test-tenant'
  })
}));

// Mock the useChat hook from ai/react
jest.mock('ai/react', () => ({
  useChat: () => ({
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm your Product Management Assistant. How can I help you today?"
      }
    ],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    error: null
  })
}));

// Mock sonner toasts
jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

const mockedAiService = aiService as jest.Mocked<typeof aiService>;

describe('AI Frontend Auto-Status Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  describe('Auto-Sync Status Display', () => {
    test('test_auto_sync_indicator', async () => {
      // Given: Auto-embedding is active
      // Expected: UI shows "Auto-sync enabled" instead of manual sync button
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      mockedAiService.getEmbeddingQueueStatus.mockResolvedValue({
        available: true,
        queueLength: 0,
        totalMessages: 5,
        oldestMessageAge: 0,
        newestMessageAge: 0,
        processing: false
      });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      // Wait for auto-embedding status to load
      await waitFor(() => {
        expect(screen.getByText('Auto-sync enabled')).toBeInTheDocument();
      });

      // Should show auto-sync status
      expect(screen.getByText('Auto-sync enabled')).toBeInTheDocument();
      
      // Button should show "Manual Sync" instead of just "Sync"
      expect(screen.getByText('Manual Sync')).toBeInTheDocument();
      
      // Should show green check icon
      const checkIcon = screen.getByTestId?.('check-circle-icon') || 
                        document.querySelector('[data-lucide="check-circle-2"]');
      expect(checkIcon).toBeTruthy();
    });

    test('test_manual_sync_fallback_display', async () => {
      // Test display when auto-embedding is not available
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(false);

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      await waitFor(() => {
        expect(screen.getByText('Manual sync')).toBeInTheDocument();
      });

      // Should show manual sync status
      expect(screen.getByText('Manual sync')).toBeInTheDocument();
      
      // Button should show just "Sync"
      expect(screen.getByText('Sync')).toBeInTheDocument();
    });
  });

  describe('Queue Progress Display', () => {
    test('test_queue_progress_display', async () => {
      // Given: 5 embedding jobs are processing
      // Expected: UI shows progress indicator "Processing 5 items..."
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      mockedAiService.getEmbeddingQueueStatus.mockResolvedValue({
        available: true,
        queueLength: 5,
        totalMessages: 10,
        oldestMessageAge: 30,
        newestMessageAge: 5,
        processing: true
      });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      // Wait for queue status to load
      await waitFor(() => {
        expect(screen.getByText('Processing 5 items...')).toBeInTheDocument();
      });

      // Should show processing status with item count
      expect(screen.getByText('Processing 5 items...')).toBeInTheDocument();
      
      // Should show orange clock icon
      const clockIcon = document.querySelector('[data-lucide="clock"]');
      expect(clockIcon).toBeTruthy();
    });

    test('test_queue_progress_updates', async () => {
      // Test that queue progress updates in real-time
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      
      // Start with items in queue
      mockedAiService.getEmbeddingQueueStatus
        .mockResolvedValueOnce({
          available: true,
          queueLength: 3,
          processing: true
        })
        .mockResolvedValueOnce({
          available: true,
          queueLength: 0,
          processing: false
        });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      // Initially should show processing
      await waitFor(() => {
        expect(screen.getByText('Processing 3 items...')).toBeInTheDocument();
      });

      // Simulate polling interval (30 seconds)
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Should update to show synced status
      await waitFor(() => {
        expect(screen.getByText('Auto-sync enabled')).toBeInTheDocument();
      });
    });
  });

  describe('Error State Display', () => {
    test('test_sync_error_display', async () => {
      // Test error state display
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      mockedAiService.getEmbeddingQueueStatus.mockResolvedValue({
        available: false,
        queueLength: 0,
        processing: false,
        error: 'Database connection failed'
      });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      await waitFor(() => {
        expect(screen.getByText('Sync error')).toBeInTheDocument();
      });

      // Should show error status
      expect(screen.getByText('Sync error')).toBeInTheDocument();
      
      // Should show red alert icon
      const alertIcon = document.querySelector('[data-lucide="alert-circle"]');
      expect(alertIcon).toBeTruthy();
    });
  });

  describe('Manual Sync Button Behavior', () => {
    test('test_manual_sync_with_auto_embedding', async () => {
      // Test manual sync button behavior when auto-embedding is enabled
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      mockedAiService.getEmbeddingQueueStatus.mockResolvedValue({
        available: true,
        queueLength: 0,
        processing: false
      });
      mockedAiService.triggerManualEmbeddingProcessing.mockResolvedValue({
        success: true,
        processed: 3
      });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      await waitFor(() => {
        expect(screen.getByText('Manual Sync')).toBeInTheDocument();
      });

      // Click manual sync button
      const syncButton = screen.getByText('Manual Sync');
      
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // Should call the auto-embedding manual trigger
      expect(mockedAiService.triggerManualEmbeddingProcessing).toHaveBeenCalled();
      
      // Button text should change during processing
      await waitFor(() => {
        expect(screen.getByText('Processing')).toBeInTheDocument();
      });
    });

    test('test_manual_sync_fallback_to_legacy', async () => {
      // Test manual sync falls back to legacy when auto-embedding not available
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(false);

      // Mock fetch for legacy API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          success: true,
          indexed: 2
        }))
      });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      await waitFor(() => {
        expect(screen.getByText('Sync')).toBeInTheDocument();
      });

      // Click sync button
      const syncButton = screen.getByText('Sync');
      
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // Should not call auto-embedding functions
      expect(mockedAiService.triggerManualEmbeddingProcessing).not.toHaveBeenCalled();
      
      // Should call legacy API
      expect(fetch).toHaveBeenCalledWith('/api/ai-chat', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"index"')
      }));
    });
  });

  describe('Real-time Status Updates', () => {
    test('test_status_polling_interval', async () => {
      // Test that status is polled every 30 seconds
      
      jest.useFakeTimers();
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      mockedAiService.getEmbeddingQueueStatus.mockResolvedValue({
        available: true,
        queueLength: 0,
        processing: false
      });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      // Initial call
      expect(mockedAiService.getEmbeddingQueueStatus).toHaveBeenCalledTimes(1);

      // Advance time by 30 seconds
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Should have polled again
      expect(mockedAiService.getEmbeddingQueueStatus).toHaveBeenCalledTimes(2);

      // Advance another 30 seconds
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      // Should have polled a third time
      expect(mockedAiService.getEmbeddingQueueStatus).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    test('test_embedding_completion_notification', async () => {
      // Given: Feature embedding is completed
      // Expected: User sees subtle notification "Data synchronized"
      
      const { toast } = require('sonner');
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      mockedAiService.getEmbeddingQueueStatus.mockResolvedValue({
        available: true,
        queueLength: 0,
        processing: false
      });
      mockedAiService.triggerManualEmbeddingProcessing.mockResolvedValue({
        success: true,
        processed: 1
      });

      await act(async () => {
        renderWithProviders(<AIChatComponent />);
      });

      // Trigger manual sync
      const syncButton = screen.getByText('Manual Sync');
      
      await act(async () => {
        fireEvent.click(syncButton);
      });

      // Should show success notification
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Successfully processed 1 items');
      });
    });
  });

  describe('Component Cleanup', () => {
    test('test_polling_cleanup_on_unmount', async () => {
      // Test that polling intervals are cleaned up when component unmounts
      
      jest.useFakeTimers();
      
      mockedAiService.isAutoEmbeddingEnabled.mockResolvedValue(true);
      mockedAiService.getEmbeddingQueueStatus.mockResolvedValue({
        available: true,
        queueLength: 0,
        processing: false
      });

      const { unmount } = await act(async () => {
        return renderWithProviders(<AIChatComponent />);
      });

      // Unmount component
      unmount();

      // Advance time - should not trigger more polling
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      // Should only have been called once (on mount)
      expect(mockedAiService.getEmbeddingQueueStatus).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });
});