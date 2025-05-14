'use client'

import { useChat } from 'ai/react';
import { Message as AIMessage } from 'ai';

// Re-export the Message type from the AI SDK
export type Message = AIMessage;

// Define the hook return type based on Vercel AI SDK
export interface AIState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isLoading: boolean;
  error?: Error | undefined;
  stop: () => void;
  reload: () => void;
  append: (message: Message) => void;
}

// Export the hook for accessing AI chat state from anywhere
export function useAIChat() {
  // useChat is the actual hook from Vercel AI SDK
  return useChat({
    api: '/api/ai-chat',
  });
}