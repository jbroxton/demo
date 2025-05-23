'use client'

import { useChat } from 'ai/react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Database, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Removed Card import - using custom dark styling instead
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
    <div className="h-full w-full flex flex-col bg-[#0A0A0A]">
      {/* Clean Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-[#0A0A0A]/80 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-white/60">Online</span>
          </div>
          <Button
            onClick={handleIndexing}
            disabled={isIndexing}
            size="sm"
            className="h-8 px-3 bg-[#1A1A1A] hover:bg-[#232326] border border-[#232326] text-white/70 hover:text-white/90 text-xs"
          >
            {isIndexing ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Indexing
              </>
            ) : (
              <>
                <Database className="w-3 h-3 mr-1.5" />
                Sync
              </>
            )}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 w-full px-4 py-6">
        <div className="space-y-4 w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 message-bubble ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-[#2a2a2c] to-[#232326] text-white/90 rounded-br-md'
                  : 'bg-gradient-to-br from-[#1A1A1A] to-[#161618] text-white/85 rounded-bl-md'
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
            <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-gradient-to-br from-[#1A1A1A] to-[#161618] shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse delay-75" />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 text-red-400/80 rounded-xl px-4 py-3 text-sm shadow-sm">
              Error: {error.message || 'Failed to get response from AI'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Clean Software-style Input */}
      <form onSubmit={handleSubmit} className="w-full p-4">
        <div className="relative">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your products, features, or get PM advice..."
            className="w-full bg-black/30 backdrop-blur-sm border border-white/20 text-white/90 placeholder:text-white/40 hover:bg-black/20 hover:border hover:border-white/20 focus:border-white/30 focus:ring-0 rounded-full pl-4 pr-12 py-3 h-12 transition-all duration-200"
            disabled={isLoading}
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1 top-1 bottom-1 bg-black/60 hover:bg-black/80 border border-white/30 text-white/90 rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}