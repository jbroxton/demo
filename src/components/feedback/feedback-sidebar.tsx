"use client";

import { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { usePagesQuery } from '@/hooks/use-pages-query';
import { useTabsQuery } from '@/hooks/use-tabs-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { formatDistanceToNow } from 'date-fns';

// Helper to get status badge variant
function getFeedbackStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'new': return 'default';
    case 'in-review': return 'secondary';
    case 'planned': return 'default';
    case 'completed': return 'default';
    case 'declined': return 'outline';
    default: return 'default';
  }
}

// Helper to get priority badge variant
function getFeedbackPriorityBadgeVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'secondary';
  }
}

export function FeedbackSidebar() {
  const { pages, isLoading, addPage } = usePagesQuery({ type: 'feedback' });
  const { openTab } = useTabsQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter and sort feedback
  const filteredFeedback = useMemo(() => {
    if (!pages) return [];
    
    return pages
      .filter(page => {
        // Text search
        if (searchTerm && !page.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Status filter
        const status = page.properties?.status?.select?.name || 'new';
        if (statusFilter !== 'all' && status !== statusFilter) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by created date, newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [pages, searchTerm, statusFilter]);

  const handleCreateFeedback = async () => {
    try {
      const newFeedback = await addPage({
        type: 'feedback',
        title: 'Untitled Feedback',
        properties: {
          status: {
            type: 'select',
            select: { name: 'new', color: 'blue' }
          },
          priority: {
            type: 'select',
            select: { name: 'medium', color: 'yellow' }
          },
          feedbackType: {
            type: 'select',
            select: { name: 'feature-request', color: 'blue' }
          },
          source: {
            type: 'select',
            select: { name: 'manual', color: 'gray' }
          }
        }
      });

      // Open the new feedback in a tab
      await openTab({
        title: 'Untitled Feedback',
        type: 'page',
        itemId: newFeedback.id,
        hasChanges: false
      });
    } catch (error) {
      console.error('Failed to create feedback:', error);
    }
  };

  const handleFeedbackClick = (feedback: any) => {
    openTab({
      title: feedback.title,
      type: 'page',
      itemId: feedback.id,
      hasChanges: false
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0A0A0A] border-r border-white/10 w-80">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border-r border-white/10 w-80" data-testid="feedback-list-container">
      {/* Header */}
      <div className="p-4 border-b border-white/10 relative">
        <div className="flex items-center mb-3">
          <h2 className="text-lg font-semibold text-white">Feedback</h2>
        </div>
        
        {/* Create button positioned to left of close button with gap */}
        <Button
          size="sm"
          onClick={handleCreateFeedback}
          className="absolute top-4 right-8 bg-blue-600 hover:bg-blue-700 z-30"
          data-testid="feedback-create-button"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
        
        {/* Search */}
        <Input
          placeholder="Search feedback..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
          data-testid="feedback-search-input"
        />
        
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full" data-testid="feedback-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-review">In Review</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Feedback List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredFeedback.length === 0 ? (
            <div className="text-center text-white/60 py-8 px-4" data-testid="feedback-empty-state">
              {searchTerm || statusFilter !== 'all' 
                ? 'No feedback matches your filters.'
                : 'No feedback yet. Click "New" to create your first item.'}
            </div>
          ) : (
            filteredFeedback.map(feedback => {
              const status = feedback.properties?.status?.select?.name || 'new';
              const priority = feedback.properties?.priority?.select?.name || 'medium';
              const customerName = feedback.properties?.customerName?.rich_text?.[0]?.text?.content || '';

              return (
                <div
                  key={feedback.id}
                  className="p-3 rounded-md hover:bg-white/5 cursor-pointer mb-2"
                  onClick={() => handleFeedbackClick(feedback)}
                  data-testid={`feedback-list-item-${feedback.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate" data-testid={`feedback-item-title-${feedback.id}`}>
                        {feedback.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {customerName && (
                          <>
                            <span className="text-xs text-white/60" data-testid={`feedback-item-customer-${feedback.id}`}>
                              {customerName}
                            </span>
                            <span className="text-xs text-white/40">•</span>
                          </>
                        )}
                        <span className="text-xs text-white/60" data-testid={`feedback-item-date-${feedback.id}`}>
                          2 hours ago
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={getFeedbackStatusBadgeVariant(status)}
                        className="text-xs"
                        data-testid={`feedback-item-status-badge-${feedback.id}`}
                      >
                        {status.replace('-', ' ')}
                      </Badge>
                      <Badge
                        variant={getFeedbackPriorityBadgeVariant(priority)}
                        className="text-xs"
                        data-testid={`feedback-item-priority-badge-${feedback.id}`}
                      >
                        {priority}
                      </Badge>
                    </div>
                  </div>
                  {feedback.properties?.assignedFeature?.relation?.[0]?.id && (
                    <div className="flex items-center gap-1 mt-2" data-testid={`feedback-item-assigned-indicator-${feedback.id}`}>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-white/40">Assigned to feature</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}