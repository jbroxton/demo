'use client'

import { useChat } from 'ai/react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Database, ChevronLeft, CheckCircle2, Clock, AlertCircle, Bot, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Removed Card import - using custom dark styling instead
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAiChatFullyManaged } from '@/hooks/use-ai-chat-fully-managed';
// TODO: Move these to API routes to avoid client-side supabase imports
// import { isAutoEmbeddingEnabled, getEmbeddingQueueStatus, triggerManualEmbeddingProcessing } from '@/services/ai-service';

export function AIChatComponent() {
  const { user, currentTenant } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [autoEmbeddingEnabled, setAutoEmbeddingEnabled] = useState<boolean | null>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  
  // Toggle between RAG and OpenAI fully managed modes
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // RAG-based chat (existing)
  const ragChat = useChat({
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

  // OpenAI fully managed chat (new)
  const openAIChat = useAiChatFullyManaged({
    onSuccess: (response) => {
      toast.success('Message sent successfully');
    },
    onError: (error) => {
      toast.error(`Chat error: ${error.message}`);
    }
  });

  // Unified interface based on selected mode
  const activeChat = useOpenAI ? {
    messages: openAIChat.messages,
    input: inputValue,
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        await openAIChat.sendMessage(inputValue);
        setInputValue('');
      }
    },
    isLoading: openAIChat.isLoading,
    error: openAIChat.error
  } : {
    messages: ragChat.messages,
    input: ragChat.input,
    handleInputChange: ragChat.handleInputChange,
    handleSubmit: ragChat.handleSubmit,
    isLoading: ragChat.isLoading,
    error: ragChat.error
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat.messages]);

  // Check auto-embedding status on mount
  useEffect(() => {
    const checkAutoEmbeddingStatus = async () => {
      try {
        const isEnabled = true; // TODO: Call API instead of direct service
        setAutoEmbeddingEnabled(isEnabled);
        
        if (isEnabled) {
          const status = { available: true, queueLength: 0 }; // TODO: Call API instead of direct service
          setQueueStatus(status);
          
          // Set sync status based on queue
          if (status.available) {
            if (status.queueLength > 0) {
              setSyncStatus('syncing');
            } else {
              setSyncStatus('synced');
            }
          } else {
            setSyncStatus('error');
          }
        }
      } catch (error) {
        console.error('Error checking auto-embedding status:', error);
        setAutoEmbeddingEnabled(false);
        setSyncStatus('error');
      }
    };

    checkAutoEmbeddingStatus();
  }, []);

  // Poll queue status every 30 seconds when auto-embedding is enabled
  useEffect(() => {
    if (!autoEmbeddingEnabled) return;

    const pollQueueStatus = async () => {
      try {
        const status = { available: true, queueLength: 0 }; // TODO: Call API instead of direct service
        setQueueStatus(status);
        
        if (status.available) {
          if (status.queueLength > 0) {
            setSyncStatus('syncing');
          } else {
            setSyncStatus('synced');
          }
        } else {
          setSyncStatus('error');
        }
      } catch (error) {
        console.error('Error polling queue status:', error);
        setSyncStatus('error');
      }
    };

    // Poll every 30 seconds
    const interval = setInterval(pollQueueStatus, 30000);
    
    return () => clearInterval(interval);
  }, [autoEmbeddingEnabled]);

  // TODO: DELETE - Manual indexing function for debugging (replace with auto-embedding)
  const handleIndexing = async () => {
    setIsIndexing(true);
    setSyncStatus('syncing');
    
    try {
      // Check if auto-embedding is enabled
      if (autoEmbeddingEnabled) {
        toast.info('Triggering manual sync...');
        
        const result = { success: true, processed: 0 }; // TODO: Call API instead of direct service
        
        if (result.success) {
          toast.success(`Successfully processed ${result.processed} items`);
          setSyncStatus('synced');
          
          // Update queue status
          const status = { available: true, queueLength: 0 }; // TODO: Call API instead of direct service
          setQueueStatus(status);
        } else {
          toast.error(`Manual sync failed: ${(result as any).error || 'Unknown error'}`);
          setSyncStatus('error');
        }
      } else {
        // Fallback to legacy manual indexing
        toast.info('Starting legacy indexing process...');
        console.warn('Using legacy manual indexing - auto-embedding not available');
        
        // Legacy indexing code (TODO: DELETE when auto-embedding is stable)
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
        
        const textResponse = await response.text();
        let data;
        
        try {
          data = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          toast.error('Could not parse server response');
          setSyncStatus('error');
          return;
        }
        
        if (response.ok && data.success) {
          toast.success(`Successfully indexed ${data.indexed || 0} items`);
          setSyncStatus('synced');
          
          if (data.errors?.length > 0) {
            console.warn('Some items failed to index:', data.errors);
            toast.warning(`Note: ${data.errors.length} items had errors`);
          }
        } else {
          const errorMessage = data.error || 'Unknown error occurred';
          console.error('Indexing failed:', errorMessage);
          toast.error(`Indexing failed: ${errorMessage}`);
          setSyncStatus('error');
        }
      }
    } catch (error) {
      console.error('Indexing error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Indexing error: ${errorMessage}`);
      setSyncStatus('error');
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0A0A0A]">
      {/* Clean Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-[#0A0A0A]/80 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-white/60">Online</span>
            </div>
            
            {/* AI Mode Toggle */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-[#1A1A1A] rounded-md border border-[#232326]">
              <div className="flex items-center gap-2">
                <Search className="w-3 h-3 text-white/60" />
                <span className="text-xs text-white/60">RAG</span>
              </div>
              <Switch 
                checked={useOpenAI} 
                onCheckedChange={setUseOpenAI}
                className="scale-75"
              />
              <div className="flex items-center gap-2">
                <Bot className="w-3 h-3 text-white/60" />
                <span className="text-xs text-white/60">OpenAI</span>
              </div>
            </div>
            
            {/* Auto-embedding status indicator */}
            {autoEmbeddingEnabled !== null && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-white/20 rounded-full"></div>
                {autoEmbeddingEnabled ? (
                  <div className="flex items-center gap-2">
                    {syncStatus === 'syncing' && (
                      <>
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-400">
                          Processing {queueStatus?.queueLength || 0} items...
                        </span>
                      </>
                    )}
                    {syncStatus === 'synced' && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">Auto-sync enabled</span>
                      </>
                    )}
                    {syncStatus === 'error' && (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-red-400">Sync error</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Database className="w-3 h-3 text-white/40" />
                    <span className="text-xs text-white/60">Manual sync</span>
                  </div>
                )}
              </div>
            )}
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
                {autoEmbeddingEnabled ? 'Processing' : 'Indexing'}
              </>
            ) : (
              <>
                <Database className="w-3 h-3 mr-1.5" />
                {autoEmbeddingEnabled ? 'Manual Sync' : 'Sync'}
              </>
            )}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 w-full px-4 py-6 h-0 overflow-y-auto">
        <div className="space-y-4 w-full">
        {activeChat.messages.map((message) => (
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
        {activeChat.isLoading && (
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
        {activeChat.error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 text-red-400/80 rounded-xl px-4 py-3 text-sm shadow-sm">
              Error: {activeChat.error.message || 'Failed to get response from AI'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Clean Software-style Input */}
      <form onSubmit={activeChat.handleSubmit} className="w-full p-4">
        <div className="relative">
          <Input
            type="text"
            value={activeChat.input}
            onChange={activeChat.handleInputChange}
            placeholder={useOpenAI 
              ? "Ask about your products with OpenAI Assistants..." 
              : "Ask about your products, features, or get PM advice..."
            }
            className="w-full bg-black/30 backdrop-blur-sm border border-white/20 text-white/90 placeholder:text-white/40 hover:bg-black/20 hover:border hover:border-white/20 focus:border-white/30 focus:ring-0 rounded-full pl-4 pr-12 py-3 h-12 transition-all duration-200"
            disabled={activeChat.isLoading}
            autoFocus
          />
          <Button
            type="submit"
            disabled={activeChat.isLoading || !activeChat.input.trim()}
            className="absolute right-1 top-1 bottom-1 bg-black/60 hover:bg-black/80 border border-white/30 text-white/90 rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all duration-200"
          >
            {activeChat.isLoading ? (
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