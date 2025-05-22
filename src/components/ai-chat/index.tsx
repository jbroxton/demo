'use client'

import { useChat } from 'ai/react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export function AIChatComponent() {
  const { user, currentTenant } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useChat({
    api: '/api/ai-chat',
    headers: {
      'x-tenant-id': currentTenant || 'default'
    },
    body: {
      tenantId: currentTenant || 'default',
      userId: user?.id,
    },
    credentials: 'include', // Include cookies for authentication
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm your Product Management Assistant. How can I help you today?"
      }
    ],
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simplified indexing function for debugging
  const handleIndexing = async () => {
    setIsIndexing(true);
    try {
      // Show toast
      toast.info('Starting indexing process...');
      
      console.log('Indexing started with tenant:', currentTenant || 'default');
      
      // Simple fetch with text response
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenant || 'default'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'index',
          tenantId: currentTenant || 'default'
        })
      });
      
      // Log raw response info for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
      
      // Get response as text first for debugging
      const textResponse = await response.text();
      console.log('Raw response:', textResponse.substring(0, 1000)); // Show first 1000 chars
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(textResponse);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        toast.error('Could not parse server response');
        return;
      }
      
      // Handle success or failure
      if (response.ok && data.success) {
        toast.success(`Successfully indexed ${data.indexed || 0} items`);
        
        if (data.errors?.length > 0) {
          console.warn('Some items failed to index:', data.errors);
          toast.warning(`Note: ${data.errors.length} items had errors`);
        }
      } else {
        const errorMessage = data.error || 'Unknown error occurred';
        console.error('Indexing failed:', errorMessage);
        toast.error(`Indexing failed: ${errorMessage}`);
      }
    } catch (error) {
      // Show the complete error
      console.error('Indexing error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        toast.error(`Indexing error: ${error.message}`);
      } else {
        toast.error(`Indexing error: ${String(error)}`);
      }
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <Card className="h-full flex flex-col border-gray-700">
      <div className="border-b border-gray-700 p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
        <Button
          onClick={handleIndexing}
          disabled={isIndexing}
          size="sm"
          variant="outline"
          className="text-gray-300 border-gray-600 hover:bg-gray-700"
        >
          {isIndexing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Index Data
            </>
          )}
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white/90'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white/90 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/20 text-red-400 rounded-lg px-4 py-2 text-sm">
              Error: {error.message || 'Failed to get response from AI'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your products, features, or get PM advice..."
            className="flex-1 bg-gray-800 text-white"
            disabled={isLoading}
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}