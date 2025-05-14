import { useAIChat, Message, AIState } from '../src/hooks/use-ai-chat';

// Test that the hook can be imported and types are accessible
console.log('Testing AI Chat hook imports...');

// Test type definitions
const testMessage: Message = {
  id: '1',
  role: 'user',
  content: 'Test message',
  createdAt: new Date()
};

console.log('✓ Message type works:', testMessage);

// Test that the hook function exists
console.log('✓ useAIChat function exists:', typeof useAIChat);

// Test the AIState interface (compile-time check)
const mockState: AIState = {
  messages: [testMessage],
  setMessages: (messages: Message[]) => {},
  input: 'test input',
  setInput: (input: string) => {},
  handleSubmit: (event: any) => {},
  handleInputChange: (event: any) => {},
  isLoading: false,
  error: undefined,
  stop: () => {},
  reload: () => {},
  append: (message: Message) => {}
};

console.log('✓ AIState interface works');
console.log('\nHook import test complete!');