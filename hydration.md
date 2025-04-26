# React Hydration Errors: Causes and Prevention

## What is Hydration?

Hydration is the process where React attaches event listeners to the static HTML that was server-rendered. During this process, React "hydrates" the static content into a fully interactive application by matching the server-rendered HTML with your component tree.

## Common Hydration Errors

The most common hydration error in React is:

```
Warning: Text content did not match. Server: "Server Text" Client: "Client Text"
```

Or:

```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

## Causes of Hydration Errors

1. **Mismatched Rendering** - The HTML generated on the server differs from what React attempts to render on the client.

2. **Dynamic Content Generation** - Using functions like `Math.random()`, `Date.now()`, or any non-deterministic logic that produces different results on server vs client.

3. **Browser-only APIs** - Accessing `window`, `document`, or other browser-only APIs during rendering.

4. **Conditional Rendering Based on Environment** - Different component structure based on whether code runs on server or client.

5. **Different Component Props** - When component props differ between server and client renders.

## How to Prevent Hydration Errors

### 1. Defer Client-side-only Code

Use `useEffect` to run browser-specific code after hydration:

```jsx
import { useEffect, useState } from 'react';

function MyComponent() {
  const [clientTime, setClientTime] = useState('');
  
  useEffect(() => {
    // This runs only on the client after hydration
    setClientTime(new Date().toLocaleTimeString());
  }, []);
  
  return <div>{clientTime || 'Loading...'}</div>;
}
```

### 2. Use Client Components in Next.js

For Next.js applications, mark components that use client-only features with the "use client" directive:

```jsx
'use client'

import { useState } from 'react';

export default function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 3. Consistent Rendering Logic

Ensure your components render the same content on both server and client:

```jsx
// Bad - different rendering logic
function BadComponent() {
  return typeof window !== 'undefined' 
    ? <div>Client</div> 
    : <div>Server</div>;
}

// Good - consistent rendering with client-side effects
function GoodComponent() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return <div>{isClient ? 'Client-enhanced' : 'Initial content'}</div>;
}
```

### 4. Suppress Hydration Warnings (Use Sparingly)

React provides a special prop for cases where mismatches are unavoidable:

```jsx
function TimeDisplay() {
  return (
    <div suppressHydrationWarning>
      Current time: {new Date().toLocaleTimeString()}
    </div>
  );
}
```

### 5. Use Dynamic Imports for Browser-only Components

```jsx
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(() => import('./ClientComponent'), {
  ssr: false // Never renders on the server
});
```

### 6. Consistent Key Generation

Ensure keys for list items are consistent between server and client:

```jsx
// Bad - keys depend on random values or execution order
{items.map(item => <li key={Math.random()}>{item}</li>)}

// Good - keys based on stable data
{items.map(item => <li key={item.id}>{item.name}</li>)}
```

## Best Practices

1. **Make Rendering Deterministic** - Avoid random values or timestamps in your JSX.

2. **Isolate Client-side Logic** - Keep browser-specific code in useEffect hooks.

3. **Use Data Attributes** - For content that must differ, consider using data attributes instead of visible content.

4. **Server Components (Next.js)** - Use server components for static content that doesn't need interactivity.

5. **Consistent Props** - Ensure props passed to components are consistent between environments.

By following these guidelines, you can avoid most hydration errors and create a smooth experience for your users. 