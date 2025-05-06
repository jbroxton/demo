# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev` - Start development server with turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run eslint

## Code Style Guidelines
- **Imports**: Group imports by type (React, stores, components, utils)
- **Types**: Use TypeScript interfaces for component props, strict typing enabled
- **Naming**: Use PascalCase for components, camelCase for functions/variables 
- **Components**: React functional components with hook state management
- **Error Handling**: Use try/catch blocks for async operations, log errors with console.error
- **Styling**: Tailwind CSS with shadcn/ui components, following dark theme
- **State Management**: Zustand for global state
- **File Structure**: Group by feature in `/src` directory
- **Component Structure**: Declare all hooks at top, then handlers, then JSX return
- **Components**: Do not build custom components. ONLY use existing pre-built components. If one does not exist and we need to choose a new one then choose the most popular and lightweight option that solves the need. Existing components and libraries:
   - shadcn/ui components (from @/components/ui)
   - Lucide React icons library
   - React built-in components
   - Use React's built-in hooks (useState, useEffect, useContext, etc.)
   - Use Zustand only for global state management
- **Styling**:
   - Only use Tailwind CSS classes for styling
   - Follow the project's existing design tokens and color scheme
   - Do not use inline CSS or external CSS libraries
   - Do not use any custom classes
**Code Cleanup**
- Delete unused function when possible 