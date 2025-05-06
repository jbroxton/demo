'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckIcon, XIcon } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { Requirement } from '@/types/models'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface NewRequirementRowProps {
  featureId: string
  onSave: (requirement: Omit<Requirement, 'id'>) => Promise<void>
  onCancel: () => void
  columnCount: number
}

export function NewRequirementRow({ 
  featureId, 
  onSave, 
  onCancel,
  columnCount 
}: NewRequirementRowProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [priority, setPriority] = useState<'High' | 'Med' | 'Low'>('Med')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        description,
        owner,
        priority,
        featureId
      })
      // Reset the form
      setName('')
      setDescription('')
      setOwner('')
      setPriority('Med')
    } catch (error) {
      console.error('Failed to save requirement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <TableRow className="bg-[#232326] hover:bg-[#2a2a2c]">
      {/* Checkbox cell - empty */}
      <TableCell className="p-2">
        <div className="w-4 h-4"></div>
      </TableCell>
      
      {/* ID cell - placeholder */}
      <TableCell className="p-2">
        <div className="w-[80px] text-xs text-muted-foreground">New</div>
      </TableCell>
      
      {/* Name cell - input */}
      <TableCell className="p-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Requirement name"
          autoFocus
          className="bg-[#1e1e20] border-[#2a2a2c] h-8 text-sm"
        />
      </TableCell>
      
      {/* Description cell - input */}
      <TableCell className="p-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="bg-[#1e1e20] border-[#2a2a2c] h-8 text-sm"
        />
      </TableCell>
      
      {/* Owner cell - input */}
      <TableCell className="p-2">
        <Input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Owner"
          className="bg-[#1e1e20] border-[#2a2a2c] h-8 text-sm"
        />
      </TableCell>
      
      {/* Priority cell - select */}
      <TableCell className="p-2">
        <Select
          value={priority}
          onValueChange={(value) => setPriority(value as 'High' | 'Med' | 'Low')}
        >
          <SelectTrigger className="bg-[#1e1e20] border-[#2a2a2c] h-8 text-sm w-[80px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Med">Med</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      
      {/* Actions cell */}
      <TableCell className="p-2 text-right" colSpan={columnCount - 6}>
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-green-500"
            onClick={() => handleSave()}
            disabled={isSubmitting || !name.trim()}
            type="button"
          >
            <CheckIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500"
            onClick={() => onCancel()}
            disabled={isSubmitting}
            type="button"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}