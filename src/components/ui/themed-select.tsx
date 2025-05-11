'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useAppTheme } from '@/providers/sidenav-theme-provider'
import { 
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface ThemedSelectProps {
  children: React.ReactNode
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  width?: string
}

export function ThemedSelect({
  children,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
  width = 'w-full',
}: ThemedSelectProps) {
  const appTheme = useAppTheme()
  
  return (
    <RadixSelect
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(appTheme.selectTrigger, width, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={appTheme.selectContent}>
        {children}
      </SelectContent>
    </RadixSelect>
  )
}

interface ThemedSelectItemProps {
  children: React.ReactNode
  value: string
  className?: string
}

export function ThemedSelectItem({
  children,
  value,
  className,
}: ThemedSelectItemProps) {
  const appTheme = useAppTheme()
  
  return (
    <SelectItem
      value={value}
      className={cn(appTheme.selectItem, className)}
    >
      {children}
    </SelectItem>
  )
}