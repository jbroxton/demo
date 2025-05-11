'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useTableTheme } from '@/providers/table-theme-provider'
import { useAppTheme } from '@/providers/sidenav-theme-provider'

type ThemedInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'search' | 'large';
  icon?: React.ReactNode;
};

export const ThemedInput = React.forwardRef<
  HTMLInputElement,
  ThemedInputProps
>(({
  className,
  variant = 'default',
  icon,
  ...props
}, ref) => {
  const theme = useTableTheme();
  const appTheme = useAppTheme();

  // Use app theme for consistent styling

  return (
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-2.5 flex items-center pointer-events-none text-white/60">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          appTheme.input,
          icon && "pl-9",
          variant === 'large' && "text-xl font-medium h-10",
          className
        )}
        {...props}
      />
    </div>
  );
});

ThemedInput.displayName = 'ThemedInput';