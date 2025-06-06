'use client'

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAiChatFullyManaged } from '@/hooks/use-ai-chat-fully-managed';
import { useAgent } from '@/providers/agent-provider';
import { usePendingConfirmations } from '@/hooks/use-agent-confirmations';
import { AgentConfirmationDialog } from '@/components/agent-confirmation-dialog';
import type { AgentMode } from '@/types/models/ai-chat';

export function AIChatComponent() {
  const { user, currentTenant } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Agent state management
  const agent = useAgent();
  const { confirmations, respondToConfirmation, isUpdating } = usePendingConfirmations();
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [activeConfirmation, setActiveConfirmation] = useState<any>(null);
  
  // Toggle between modes: Ask (OpenAI), Agent (OpenAI with function calling)
  const [chatMode, setChatMode] = useState<'ask' | 'agent'>('ask');
  const [inputValue, setInputValue] = useState('');
  

  // OpenAI fully managed chat (ask mode)
  const askChat = useAiChatFullyManaged({
    mode: 'ask',
    sessionId: agent.state.sessionId || undefined,
    onSuccess: (response) => {
      toast.success('Message sent successfully');
    },
    onError: (error) => {
      toast.error(`Chat error: ${error.message}`);
    }
  });

  // OpenAI agent chat (agent mode with function calling)
  const agentChat = useAiChatFullyManaged({
    mode: 'agent',
    sessionId: agent.state.sessionId || undefined,
    onSuccess: (response) => {
      toast.success('Message sent successfully');
    },
    onError: (error) => {
      toast.error(`Agent error: ${error.message}`);
    }
  });

  // Unified interface based on selected mode
  const activeChat = chatMode === 'ask' ? {
    messages: askChat.messages,
    input: inputValue,
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim() && !askChat.isLoading) {
        try {
          await askChat.sendMessage(inputValue);
          setInputValue('');
        } catch (error) {
          console.error('Failed to send message:', error);
          // Don't clear input on error so user can retry
        }
      }
    },
    isLoading: askChat.isLoading,
    error: askChat.error
  } : {
    messages: agentChat.messages,
    input: inputValue,
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim() && !agentChat.isLoading) {
        try {
          await agentChat.sendMessage(inputValue);
          setInputValue('');
        } catch (error) {
          console.error('Failed to send message:', error);
          // Don't clear input on error so user can retry
        }
      }
    },
    isLoading: agentChat.isLoading,
    error: agentChat.error
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat.messages]);

  // Initialize agent session when switching to agent mode
  useEffect(() => {
    if (chatMode === 'agent' && !agent.state.currentSession) {
      agent.initializeSession('agent');
    } else if (chatMode === 'ask' && agent.state.mode !== 'ask') {
      agent.updateSessionMode('ask');
    }
  }, [chatMode, agent]);

  // Handle pending confirmations
  useEffect(() => {
    if (confirmations.length > 0 && !showConfirmationDialog) {
      const firstConfirmation = confirmations[0];
      setActiveConfirmation(firstConfirmation);
      setShowConfirmationDialog(true);
    }
  }, [confirmations, showConfirmationDialog]);

  // Handle confirmation response
  const handleConfirmationResponse = async (
    confirmationId: string,
    response: 'confirmed' | 'rejected' | 'cancelled',
    details?: any
  ) => {
    try {
      await respondToConfirmation(confirmationId, response, details);
      setShowConfirmationDialog(false);
      setActiveConfirmation(null);
      
      if (response === 'confirmed') {
        toast.success('Action confirmed successfully');
      } else if (response === 'rejected') {
        toast.info('Action rejected');
      } else {
        toast.info('Action cancelled');
      }
    } catch (error) {
      toast.error('Failed to respond to confirmation');
      console.error('Confirmation response error:', error);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmationDialog(false);
    setActiveConfirmation(null);
  };




  return (
    <div className="h-full w-full flex flex-col bg-[#0A0A0A]">
      {/* Clean Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-[#0A0A0A]/80 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Agent Status Indicators */}
            {chatMode === 'agent' && (
              <div className="flex items-center gap-2">
                {agent.state.pendingActions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {agent.state.pendingActions.length} pending
                  </Badge>
                )}
                {confirmations.length > 0 && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {confirmations.length} confirmation{confirmations.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {agent.state.isProcessing && (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    <span className="text-xs text-blue-400">Processing</span>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
      <div className="flex-1 w-full px-5 py-6 h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  ? 'bg-transparent border border-black/70 text-white/90 rounded-br-md'
                  : 'bg-transparent border border-white/10 text-white/90 rounded-bl-md'
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
            <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-transparent border border-white/10">
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
      </div>

      {/* Floating Chat Input */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl m-4 shadow-2xl">
        {/* Row 1: Context */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-white/60 hover:text-white/80 hover:bg-black/60 transition-all duration-200">
              @ Add context
            </button>
          </div>
        </div>

        {/* Row 2: Text Input */}
        <form onSubmit={activeChat.handleSubmit} className="px-4 py-3">
          <Textarea
            value={activeChat.input}
            onChange={(e) => activeChat.handleInputChange(e as any)}
            placeholder={
              chatMode === 'ask'
                ? "Ask me anything..."
                : "Create, update, or manage..."
            }
            className="w-full bg-transparent border-none text-white/90 placeholder:text-white/40 resize-none focus:ring-0 focus:outline-none text-sm leading-relaxed"
            disabled={activeChat.isLoading}
            autoFocus
            rows={3}
            style={{ 
              minHeight: '72px',
              maxHeight: '200px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 200) + 'px';
            }}
          />
        </form>

        {/* Row 3: Controls */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex bg-black/40 rounded-full p-0.5">
              <button
                onClick={() => setChatMode('ask')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-200 ${
                  chatMode === 'ask'
                    ? 'bg-black/60 text-white'
                    : 'text-white/60 hover:text-white/80 hover:bg-black/40'
                }`}
              >
                Ask
              </button>
              <button
                onClick={() => setChatMode('agent')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-200 ${
                  chatMode === 'agent'
                    ? 'bg-black/60 text-white'
                    : 'text-white/60 hover:text-white/80 hover:bg-black/40'
                }`}
              >
                Agent
              </button>
            </div>

            {/* Model Name */}
            <div className="text-xs text-white/40">
              GPT-4
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={activeChat.isLoading || !activeChat.input.trim()}
            onClick={activeChat.handleSubmit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeChat.isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                Send
              </>
            )}
          </button>
        </div>
      </div>

      {/* Agent Confirmation Dialog */}
      <AgentConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={handleCloseConfirmation}
        confirmation={activeConfirmation}
        action={activeConfirmation} // In a real implementation, you'd fetch the action details
        onConfirm={handleConfirmationResponse}
        isProcessing={isUpdating}
      />
    </div>
  );
}