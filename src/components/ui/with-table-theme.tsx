'use client'

import React from 'react'
import { useTableTheme } from '@/providers/table-theme-provider'

// Higher-order component to inject table theme into any component
export function withTableTheme<P extends object>(
  Component: React.ComponentType<P & { theme: any }>
): React.FC<P> {
  const WithTableTheme = (props: P) => {
    const theme = useTableTheme()
    return <Component {...props} theme={theme} />
  }
  
  // Set display name for better debugging
  const displayName = Component.displayName || Component.name || 'Component'
  WithTableTheme.displayName = `WithTableTheme(${displayName})`
  
  return WithTableTheme
}

// Example usage:
// const ThemedComponent = withTableTheme(UnthemedComponent)
// export { ThemedComponent }