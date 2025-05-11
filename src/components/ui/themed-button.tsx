'use client'

import React from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { withTableTheme } from './with-table-theme'
import { useAppTheme } from '@/providers/sidenav-theme-provider'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: React.ReactNode;
};

export const ThemedButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({
  className,
  variant = 'primary',
  icon,
  children,
  ...props
}, ref) => {
  const appTheme = useAppTheme();

  // Map our variant to the appropriate theme style
  const getButtonClass = () => {
    switch (variant) {
      case 'primary':
        return appTheme.buttonPrimary;
      case 'secondary':
        return appTheme.buttonSecondary;
      case 'danger':
        return appTheme.buttonDanger;
      case 'outline':
        return appTheme.buttonPrimary; // Use primary as default for outline
      default:
        return appTheme.buttonPrimary;
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(getButtonClass(), className)}
      {...props}
    >
      {icon && <span className={appTheme.buttonIcon}>{icon}</span>}
      {children}
    </button>
  );
});

ThemedButton.displayName = 'ThemedButton';