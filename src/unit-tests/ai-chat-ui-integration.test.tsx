/**
 * @file UI Integration Tests for AI Chat Toggle Functionality
 * @description Tests the chat mode toggle and UI state management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIChat } from '@/components/ai-chat';

// Mock the hooks
jest.mock('@/hooks/use-ai-chat', () => ({
  useAIChat: jest.fn()
}));

jest.mock('@/hooks/use-ai-chat-fully-managed', () => ({
  useAIChatFullyManaged: jest.fn()
}));

// Mock auth provider
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123' },
    tenantId: 'tenant-456'
  }))
}));

const mockUseAIChat = require('@/hooks/use-ai-chat').useAIChat;
const mockUseAIChatFullyManaged = require('@/hooks/use-ai-chat-fully-managed').useAIChatFullyManaged;

describe('AI Chat UI Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Mock default hook returns
    mockUseAIChat.mockReturnValue({
      messages: [],
      isLoading: false,
      sendMessage: jest.fn(),
      clearMessages: jest.fn()
    });

    mockUseAIChatFullyManaged.mockReturnValue({
      messages: [],
      isLoading: false,
      sendMessage: jest.fn(),
      clearMessages: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Chat Mode Toggle', () => {
    it('should start with custom RAG mode by default', () => {
      renderWithProviders(<AIChat />);
      
      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();
      
      // Should use custom RAG hook
      expect(mockUseAIChat).toHaveBeenCalled();
      expect(mockUseAIChatFullyManaged).not.toHaveBeenCalled();
    });

    it('should switch to OpenAI fully managed mode when toggled', async () => {
      renderWithProviders(<AIChat />);
      
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(toggle).toBeChecked();
      });
      
      // Should now use fully managed hook
      expect(mockUseAIChatFullyManaged).toHaveBeenCalled();
    });

    it('should display correct mode labels', () => {
      renderWithProviders(<AIChat />);
      
      expect(screen.getByText(/Custom RAG/i)).toBeInTheDocument();
      expect(screen.getByText(/OpenAI Managed/i)).toBeInTheDocument();
    });

    it('should clear messages when switching modes', async () => {
      const mockClearRAG = jest.fn();
      const mockClearManaged = jest.fn();
      
      mockUseAIChat.mockReturnValue({
        messages: [{ id: '1', content: 'RAG message', role: 'user' }],
        isLoading: false,
        sendMessage: jest.fn(),
        clearMessages: mockClearRAG
      });

      mockUseAIChatFullyManaged.mockReturnValue({
        messages: [],
        isLoading: false,
        sendMessage: jest.fn(),
        clearMessages: mockClearManaged
      });

      renderWithProviders(<AIChat />);
      
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(mockClearRAG).toHaveBeenCalled();
      });
    });

    it('should maintain separate message histories for each mode', async () => {
      const ragMessages = [{ id: '1', content: 'RAG message', role: 'user' }];
      const managedMessages = [{ id: '2', content: 'Managed message', role: 'user' }];
      
      mockUseAIChat.mockReturnValue({
        messages: ragMessages,
        isLoading: false,
        sendMessage: jest.fn(),
        clearMessages: jest.fn()
      });

      mockUseAIChatFullyManaged.mockReturnValue({
        messages: managedMessages,
        isLoading: false,
        sendMessage: jest.fn(),
        clearMessages: jest.fn()
      });

      renderWithProviders(<AIChat />);
      
      // Check RAG mode shows RAG messages
      expect(screen.getByText('RAG message')).toBeInTheDocument();
      
      // Switch to managed mode
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(screen.getByText('Managed message')).toBeInTheDocument();
        expect(screen.queryByText('RAG message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Message Input and Sending', () => {
    it('should send message using correct hook based on mode', async () => {
      const mockSendRAG = jest.fn();
      const mockSendManaged = jest.fn();
      
      mockUseAIChat.mockReturnValue({
        messages: [],
        isLoading: false,
        sendMessage: mockSendRAG,
        clearMessages: jest.fn()
      });

      mockUseAIChatFullyManaged.mockReturnValue({
        messages: [],
        isLoading: false,
        sendMessage: mockSendManaged,
        clearMessages: jest.fn()
      });

      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Test RAG mode
      fireEvent.change(input, { target: { value: 'How many features?' } });
      fireEvent.click(sendButton);
      
      expect(mockSendRAG).toHaveBeenCalledWith('How many features?');
      expect(mockSendManaged).not.toHaveBeenCalled();
      
      // Switch to managed mode
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(toggle).toBeChecked();
      });
      
      // Test managed mode
      fireEvent.change(input, { target: { value: 'What is feature priority?' } });
      fireEvent.click(sendButton);
      
      expect(mockSendManaged).toHaveBeenCalledWith('What is feature priority?');
    });

    it('should disable input when loading', () => {
      mockUseAIChat.mockReturnValue({
        messages: [],
        isLoading: true,
        sendMessage: jest.fn(),
        clearMessages: jest.fn()
      });

      renderWithProviders(<AIChat />);
      
      const input = screen.getByPlaceholderText(/ask about your data/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error state when hook returns error', () => {
      mockUseAIChat.mockReturnValue({
        messages: [],
        isLoading: false,
        error: 'Connection failed',
        sendMessage: jest.fn(),
        clearMessages: jest.fn()
      });

      renderWithProviders(<AIChat />);
      
      expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
    });

    it('should recover from error state when switching modes', async () => {
      mockUseAIChat.mockReturnValue({
        messages: [],
        isLoading: false,
        error: 'RAG error',
        sendMessage: jest.fn(),
        clearMessages: jest.fn()
      });

      mockUseAIChatFullyManaged.mockReturnValue({
        messages: [],
        isLoading: false,
        sendMessage: jest.fn(),
        clearMessages: jest.fn()
      });

      renderWithProviders(<AIChat />);
      
      expect(screen.getByText(/RAG error/i)).toBeInTheDocument();
      
      // Switch modes
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      await waitFor(() => {
        expect(screen.queryByText(/RAG error/i)).not.toBeInTheDocument();
      });
    });
  });
});