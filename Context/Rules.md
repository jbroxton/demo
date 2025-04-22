#Rules
- The app should be client side only

- ONLY use existing pre-built components from:
   - shadcn/ui components (from @/components/ui)
   - Lucide React icons library
   - React built-in components

- DO NOT create custom UI components from scratch when a shadcn alternative exists
   - First check if a shadcn component meets the need
   - Use composition of existing components rather than creating new ones

- For state management:
   - Use React's built-in hooks (useState, useEffect, useContext, etc.)
   - Use Zustand for global state management
   - Use localStorage for client-side persistence
   - Do not install additional state management libraries beyond Zustand

- Styling:
   - Only use Tailwind CSS classes for styling
   - Follow the project's existing design tokens and color scheme
   - Do not use inline CSS or external CSS libraries
   - Do not use any custom classes

- When implementing features:
   - Compose existing components rather than building custom ones
   - Document component composition patterns
   - Keep code structure consistent with the existing project architecture

- Delete and clean up codebase when possible. 

The goal is to maintain consistency by leveraging the established component library rather than creating custom implementations.