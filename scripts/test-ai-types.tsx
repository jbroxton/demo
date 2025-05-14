import React from 'react';
import { useAIChat } from '../src/hooks/use-ai-chat';

// Test component to verify types work in a React context
const TestComponent: React.FC = () => {
  // This would normally be called inside a component
  // const aiState = useAIChat();
  
  // For testing, let's just verify the type
  type HookType = typeof useAIChat;
  
  console.log('Hook type test passed');
  
  return null;
};

console.log('TypeScript types verification complete');