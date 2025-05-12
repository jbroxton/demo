'use client'

import { useState } from 'react'
import { Requirement } from '@/types/models'
import { 
  ThemedTableRow, 
  ThemedTableCell,
  ThemedTableInput,
  ThemedTableSelect 
} from '@/components/ui/themed-table'
import { useTableTheme } from '@/providers/table-theme-provider'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface ThemedNewRequirementRowProps {
  featureId: string
  releaseId?: string
  onSave: (requirement: Omit<Requirement, 'id'>) => Promise<boolean>
  onCancel: () => void
  columnCount: number
}

export function ThemedNewRequirementRow({
  featureId,
  releaseId,
  onSave,
  onCancel,
  columnCount
}: ThemedNewRequirementRowProps) {
  const theme = useTableTheme();
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [priority, setPriority] = useState<'High' | 'Med' | 'Low'>('Med')

  const handleSave = async () => {
    if (!name.trim()) {
      // Show error or validation message
      return
    }

    setIsSaving(true)
    try {
      const newRequirement: Omit<Requirement, 'id'> = {
        name: name.trim(),
        description,
        owner: owner || undefined,
        priority,
        featureId,
        releaseId: releaseId || undefined
      }

      const success = await onSave(newRequirement)
      if (success) {
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save requirement:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setOwner('')
    setPriority('Med')
  }

  return (
    <ThemedTableRow className={`${theme.colors.bgInput} border-b ${theme.colors.borderHeader}`}>
      {/* Select checkbox placeholder */}
      <ThemedTableCell className="w-[40px]" editable>
        <div className="w-4 h-4"></div>
      </ThemedTableCell>
      
      {/* ID cell - will be auto-generated */}
      <ThemedTableCell className="w-[80px]" editable>
        <div className="opacity-50 italic">Auto</div>
      </ThemedTableCell>
      
      {/* Name field */}
      <ThemedTableCell editable>
        <ThemedTableInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Requirement name"
          className="w-full"
          autoFocus
        />
      </ThemedTableCell>
      
      {/* Description field */}
      <ThemedTableCell editable>
        <ThemedTableInput
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full"
        />
      </ThemedTableCell>
      
      {/* Owner field */}
      <ThemedTableCell editable>
        <ThemedTableInput
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Owner (optional)"
          className="w-full"
        />
      </ThemedTableCell>
      
      {/* Priority field */}
      <ThemedTableCell className="w-[80px]" editable>
        <ThemedTableSelect
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'High' | 'Med' | 'Low')}
          className="w-full"
        >
          <option value="High">High</option>
          <option value="Med">Med</option>
          <option value="Low">Low</option>
        </ThemedTableSelect>
      </ThemedTableCell>
      
      {/* Actions column */}
      <ThemedTableCell colSpan={columnCount - 6} editable>
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="bg-[#0C0C0C] border border-white/[0.02] hover:bg-[#121218] hover:border-white/[0.04] h-8 px-2"
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-[#0C0C0C] border border-[#9333EA]/15 hover:bg-[#121218] hover:border-[#9333EA]/25 h-8 px-3"
            disabled={isSaving || !name.trim()}
          >
            <Check className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </ThemedTableCell>
    </ThemedTableRow>
  )
}