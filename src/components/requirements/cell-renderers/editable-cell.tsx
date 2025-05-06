'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditableCellProps {
  value: string
  row: any
  column: any
  onSave: (value: string) => Promise<void>
}

export function EditableCell({
  value: initialValue,
  row,
  column,
  onSave,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  
  // Determine if this is a longer text field that needs a textarea
  const isLongText = column.id === 'description' || 
                     column.id === 'acceptanceCriteria' || 
                     (initialValue && initialValue.length > 50)

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  // Reset value when initialValue changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSave = async () => {
    try {
      setIsEditing(false)
      if (value !== initialValue) {
        console.log(`Saving value: ${value} for column: ${column.id}`)
        await onSave(value)
        console.log('Save completed')
      }
    } catch (error) {
      console.error('Error saving value:', error)
      // Revert back to editing state if save fails
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setValue(initialValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Only handle Enter for single-line inputs
    if (!isLongText && e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col space-y-1">
        {isLongText ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] py-1 text-sm"
            rows={3}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 py-1"
          />
        )}
        <div className="flex justify-end space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-green-500"
            onClick={() => handleSave()}
            type="button"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500"
            onClick={() => handleCancel()}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between group">
      <div className="flex-1 break-words">
        {isLongText ? (
          <div className="whitespace-pre-wrap">{value || '-'}</div>
        ) : (
          <span>{value || '-'}</span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
        onClick={() => {
          console.log('Edit button clicked')
          setIsEditing(true)
        }}
        type="button"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  )
}