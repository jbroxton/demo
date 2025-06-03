'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePagesQuery } from '@/hooks/use-pages-query';
import type { Block } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from './data-table';
import { getRequirementsColumns, RequirementRow } from './requirements-columns';

interface RequirementsPagesTableProps {
  requirements?: RequirementRow[];
  featureId: string | null;
  isEditable?: boolean;
}

export function RequirementsPagesTable({ 
  requirements: propRequirements, 
  featureId, 
  isEditable = true 
}: RequirementsPagesTableProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRequirement, setNewRequirement] = useState({
    title: '',
    status: 'pending',
    priority: 'medium',
    jiraId: '',
  });
  
  const { data: feature, addBlock, updateBlock, deleteBlock } = usePagesQuery({ 
    id: featureId || undefined 
  });

  // Use prop requirements if provided, otherwise get from feature
  const requirements = propRequirements || (feature?.blocks || []).filter(
    (block: Block) => block.type === 'requirement'
  ).map((req: Block) => ({
    id: req.id,
    title: req.properties?.title?.value || 'Untitled',
    status: req.properties?.status?.value || 'pending',
    priority: req.properties?.priority?.value || 'medium',
    jiraId: req.properties?.jira_id?.value || '',
    assignedTo: req.properties?.assigned_to?.value || null,
    createdAt: req.properties?.created_at?.value || new Date().toISOString(),
  }));

  const handleAddRequirement = async () => {
    if (!featureId || !newRequirement.title.trim()) return;

    const block: Partial<Block> = {
      type: 'requirement',
      properties: {
        title: { type: 'text', value: newRequirement.title },
        status: { type: 'select', value: newRequirement.status },
        priority: { type: 'select', value: newRequirement.priority },
        jira_id: { type: 'text', value: newRequirement.jiraId },
        created_at: { type: 'date', value: new Date().toISOString() },
      },
      content: {},
    };

    await addBlock(featureId, block);
    setIsAddingNew(false);
    setNewRequirement({ title: '', status: 'pending', priority: 'medium', jiraId: '' });
  };

  const handleDeleteRequirement = async (requirementId: string) => {
    if (!featureId) return;
    await deleteBlock(featureId, requirementId);
  };

  // Get columns configuration
  const columns = useMemo(() => 
    getRequirementsColumns(handleDeleteRequirement, isEditable), 
    [isEditable]
  );

  return (
    <div className="space-y-4">
      {/* DataTable with consistent styling from roadmap table */}
      <DataTable
        columns={columns}
        data={requirements}
      />
      
      {/* Add new requirement form */}
      {isAddingNew && (
        <div className="rounded-lg border border-[#2a2a2c] bg-[#0a0a0a] p-4 space-y-4">
          <h4 className="text-sm font-medium text-white">Add New Requirement</h4>
          <div className="grid grid-cols-4 gap-4">
            <Input
              placeholder="Requirement title"
              value={newRequirement.title}
              onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddRequirement();
                if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewRequirement({ title: '', status: 'pending', priority: 'medium', jiraId: '' });
                }
              }}
              autoFocus
              className="bg-[#161618] border-white/10 text-white"
            />
            <Select
              value={newRequirement.status}
              onValueChange={(value) => setNewRequirement({ ...newRequirement, status: value })}
            >
              <SelectTrigger className="bg-[#161618] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161618] border-white/10">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={newRequirement.priority}
              onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value })}
            >
              <SelectTrigger className="bg-[#161618] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161618] border-white/10">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="PROJ-123"
              value={newRequirement.jiraId}
              onChange={(e) => setNewRequirement({ ...newRequirement, jiraId: e.target.value })}
              className="bg-[#161618] border-white/10 text-white"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewRequirement({ title: '', status: 'pending', priority: 'medium', jiraId: '' });
              }}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleAddRequirement}
              className="bg-white text-black hover:bg-white/90"
            >
              Save Requirement
            </Button>
          </div>
        </div>
      )}
      
      {isEditable && !isAddingNew && (
        <Button
          onClick={() => setIsAddingNew(true)}
          size="sm"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Requirement
        </Button>
      )}
    </div>
  );
}