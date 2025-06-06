/**
 * @file React Hook for OpenAI Fully Managed Chat
 * @description Hook for managing OpenAI Assistants-based chat functionality
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  threadId?: string;
  runId?: string;
}

interface ChatResponse {
  message: string;
  threadId: string;
  runId: string;
}

interface ChatError {
  message: string;
  code?: string;
  status?: number;
}

interface UseChatOptions {
  mode?: 'ask' | 'agent';
  sessionId?: string;
  onSuccess?: (response: ChatResponse) => void;
  onError?: (error: ChatError) => void;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Custom hook for OpenAI fully managed chat functionality
 * Uses OpenAI Assistants API with persistent threads and file search
 */
export function useAiChatFullyManaged(options: UseChatOptions = {}) {
  const { currentTenant } = useAuth();
  const tenantId = currentTenant;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Chat mutation with error handling and retries
  const chatMutation = useMutation({
    mutationFn: async ({ message }: { message: string }): Promise<ChatResponse> => {
      if (!tenantId) {
        throw new Error('No tenant ID available');
      }

      const response = await fetch('/api/ai-chat-fully-managed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          tenantId,
          mode: options.mode || 'ask',
          sessionId: options.sessionId,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.text();
          // Try to parse as JSON first
          try {
            const jsonError = JSON.parse(errorData);
            errorMessage = jsonError.error || errorMessage;
          } catch {
            // If not JSON, use the text as error message
            errorMessage = errorData || errorMessage;
          }
        } catch {
          // If we can't read the response, use the status text
        }
        
        console.error('AI Chat API Error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage
        });
        
        // Provide user-friendly error messages for common issues
        if (response.status === 429) {
          throw new Error('The AI is still processing your previous message. Please wait a moment and try again.');
        } else if (response.status === 400 && errorMessage.includes('while a run') && errorMessage.includes('is active')) {
          throw new Error('Please wait for the current conversation to complete before sending another message.');
        } else if (response.status >= 500) {
          throw new Error('The AI service is temporarily unavailable. Please try again in a moment.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('OpenAI API Response:', data); // Debug logging
      console.log('Request mode:', options.mode || 'ask'); // Debug mode
      return data;
    },
    onSuccess: (response) => {
      // Update thread ID if we got a new one
      if (response.threadId && response.threadId !== threadId) {
        setThreadId(response.threadId);
      }

      // Add assistant response to messages
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        threadId: response.threadId,
        runId: response.runId,
      };

      setMessages(prev => [...prev, assistantMessage]);
      options.onSuccess?.(response);
    },
    onError: (error: Error) => {
      const chatError: ChatError = {
        message: error.message,
        code: 'CHAT_ERROR',
      };
      options.onError?.(chatError);
    },
    retry: options.maxRetries ?? 2,
    retryDelay: options.retryDelay ?? 1000,
  });

  /**
   * Send a message to the AI assistant
   * Prevents concurrent requests to avoid OpenAI thread conflicts
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (!tenantId) {
      throw new Error('No tenant ID available');
    }

    // Prevent concurrent requests - check if a request is already in progress
    if (chatMutation.isPending) {
      throw new Error('Please wait for the current message to complete before sending another.');
    }

    // Add user message to the conversation
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to OpenAI
      return await chatMutation.mutateAsync({ message: content });
    } catch (error) {
      // If the request fails, we should handle the error appropriately
      console.error('Failed to send message:', error);
      
      // Remove the user message if the request failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      throw error;
    }
  }, [tenantId, chatMutation]);

  /**
   * Clear the conversation history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setThreadId(null);
  }, []);

  /**
   * Retry the last failed message
   */
  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'user');

    if (lastUserMessage) {
      return sendMessage(lastUserMessage.content);
    }

    throw new Error('No user message to retry');
  }, [messages, sendMessage]);

  /**
   * Get conversation context for debugging
   */
  const getConversationContext = useCallback(() => {
    return {
      threadId,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1],
      tenantId,
    };
  }, [threadId, messages, tenantId]);

  return {
    // State
    messages,
    threadId,
    isLoading: chatMutation.isPending,
    error: chatMutation.error,
    isError: chatMutation.isError,

    // Actions
    sendMessage,
    clearMessages,
    retryLastMessage,

    // Utils
    getConversationContext,

    // Raw mutation (for advanced usage)
    chatMutation,
  };
}

// Export types for consumers
export type { ChatMessage, ChatResponse, ChatError, UseChatOptions };