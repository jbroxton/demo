"use client"

import { useState, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Eye,
  FileText,
  Calendar,
  User,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAgent } from '@/providers/agent-provider';
import { useAgentSessions } from '@/hooks/use-agent-sessions';
import { formatDistanceToNow } from 'date-fns';

interface AgentActionHistoryProps {
  limit?: number;
  showFilters?: boolean;
  compact?: boolean;
}

/**
 * Agent Action History Component
 * 
 * Displays a list of agent actions with filtering and status indicators
 */
export function AgentActionHistory({
  limit = 50,
  showFilters = true,
  compact = false
}: AgentActionHistoryProps) {
  const agent = useAgent();
  const { sessions, isLoading, refetch } = useAgentSessions({ limit: 10 });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  
  // Get actions from recent actions and current session
  const allActions = useMemo(() => {
    const actions = [...agent.state.recentActions];
    
    // Add pending actions if not already included
    agent.state.pendingActions.forEach(pendingAction => {
      if (!actions.find(a => a.id === pendingAction.id)) {
        actions.unshift(pendingAction);
      }
    });
    
    return actions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [agent.state.recentActions, agent.state.pendingActions, limit]);
  
  // Apply filters
  const filteredActions = useMemo(() => {
    return allActions.filter(action => {
      if (statusFilter !== 'all' && action.status !== statusFilter) return false;
      if (entityFilter !== 'all' && action.entityType !== entityFilter) return false;
      if (operationFilter !== 'all' && action.operationType !== operationFilter) return false;
      return true;
    });
  }, [allActions, statusFilter, entityFilter, operationFilter]);
  
  // Get unique values for filters
  const entityTypes = useMemo(() => {
    return [...new Set(allActions.map(a => a.entityType))];
  }, [allActions]);
  
  const operationTypes = useMemo(() => {
    return [...new Set(allActions.map(a => a.operationType))];
  }, [allActions]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'confirmed':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default' as const;
      case 'failed':
        return 'destructive' as const;
      case 'pending':
      case 'confirmed':
        return 'secondary' as const;
      case 'rejected':
      case 'cancelled':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };
  
  const getOperationIcon = (operationType: string) => {
    switch (operationType) {
      case 'create':
        return <Plus className="h-3 w-3" />;
      case 'update':
        return <Edit3 className="h-3 w-3" />;
      case 'delete':
        return <Trash2 className="h-3 w-3" />;
      case 'read':
        return <Eye className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };
  
  const formatParameters = (params: any): string => {
    if (!params || typeof params !== 'object') return '';
    
    const keyParams = Object.entries(params)
      .filter(([key, value]) => value !== undefined && value !== null && value !== '')
      .slice(0, 3) // Show first 3 params
      .map(([key, value]) => {
        const displayKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        let displayValue = String(value);
        if (displayValue.length > 20) {
          displayValue = displayValue.substring(0, 20) + '...';
        }
        return `${displayKey}: ${displayValue}`;
      });
    
    return keyParams.join(', ');
  };
  
  const handleRefresh = () => {
    agent.loadRecentActions();
    refetch();
  };
  
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Recent Actions</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        
        <ScrollArea className="h-48">
          <div className="space-y-1">
            {filteredActions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No actions yet
              </p>
            ) : (
              filteredActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center gap-2 p-2 rounded border text-xs"
                >
                  {getStatusIcon(action.status)}
                  <div className="flex items-center gap-1">
                    {getOperationIcon(action.operationType)}
                    <span className="capitalize">{action.operationType}</span>
                  </div>
                  <span className="capitalize text-muted-foreground">
                    {action.entityType}
                  </span>
                  <span className="text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Agent Action History</CardTitle>
            <CardDescription>
              Track all agent operations and their status
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {showFilters && (
          <div className="flex gap-2 pt-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={operationFilter} onValueChange={setOperationFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                {operationTypes.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredActions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No actions found</p>
                <p className="text-sm text-muted-foreground">
                  {allActions.length === 0 
                    ? "Start using the agent to see actions here"
                    : "Try adjusting your filters"
                  }
                </p>
              </div>
            ) : (
              filteredActions.map((action, index) => (
                <div key={action.id}>
                  <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(action.status)}
                      <div className="flex items-center gap-1">
                        {getOperationIcon(action.operationType)}
                        <Badge variant={getStatusBadgeVariant(action.status)} className="text-xs">
                          {action.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm capitalize">
                          {action.operationType} {action.entityType}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {action.functionName}
                        </span>
                      </div>
                      
                      {action.functionParameters && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatParameters(action.functionParameters)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                        </div>
                        {action.completedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Completed {formatDistanceToNow(new Date(action.completedAt), { addSuffix: true })}
                          </div>
                        )}
                        {action.entityId && (
                          <div className="text-xs font-mono">
                            ID: {action.entityId.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredActions.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}