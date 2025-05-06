# Shadcn UI Styling Guidelines
Use
- Tailwind v4 only
- Shadcn
- next-themes for theme management

## 1. CSS VARIABLES SYSTEM
ALWAYS use CSS variables for theming, not direct utility classes for theme colors. ALWAYS define theme colors as CSS variables in globals.css, THEN use Tailwind utility classes (bg-primary, text-foreground) to apply them in components.
```css
/* Example in globals.css */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);
  --primary-foreground: oklch(0.985 0 0);
}
```

## 2. COLOR SEMANTIC MAPPING
ALWAYS map these exact semantic color variables to components:
| Semantic Purpose | Background Class | Text Class |
|------------------|------------------|------------|
| Default UI | bg-background | text-foreground |
| Primary actions | bg-primary | text-primary-foreground |
| Secondary UI | bg-secondary | text-secondary-foreground |
| Subtle emphasis | bg-accent | text-accent-foreground |
| Subdued elements | bg-muted | text-muted-foreground |
| Card elements | bg-card | text-card-foreground |
| Error states | bg-destructive | text-destructive-foreground |
| Warning states | bg-warning | text-warning-foreground |

## 3. TYPOGRAPHY RULES
- Font family: ALWAYS use `font-sans` as base
- Text sizes: STRICTLY follow scale: xs(12px), sm(14px), base(16px), lg(18px), xl(20px), 2xl(24px), 3xl(30px), 4xl(36px)
- Heading components: h1(4xl), h2(3xl), h3(2xl), h4(xl), h5(lg), h6(base)
- ALWAYS use `text-foreground` for main text, `text-muted-foreground` for secondary text

## 4. COMPONENT STYLING
Border radius scale - ALWAYS use these exact values:
- none: 0px
- sm: 0.125rem (2px) - checkboxes, menu items
- DEFAULT: 0.25rem (4px) - buttons, inputs
- md: 0.375rem (6px)
- lg: 0.5rem (8px) - cards
- xl: 0.75rem (12px) - modals
- 2xl: 1rem (16px)
- full: 9999px - pills, avatars

## 5. DARK MODE IMPLEMENTATION
- ALWAYS use next-themes for theme management - NEVER create custom theme providers
- Configure next-themes in providers.tsx with: `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>`
- Include dark mode variants using `.dark` class in CSS
- Example:
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
}
.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
}
```
- Use the ThemeToggle component from src/components/theme-toggle.tsx for toggling themes
- Import useTheme from next-themes: `import { useTheme } from "next-themes"`

## 6. INTEGRATION RULES
- NEVER use raw color values (like text-blue-500)
- ALWAYS use semantic class names (bg-primary, text-muted-foreground)
- ALWAYS maintain component patterns from shadcn documentation
- ALWAYS use shadcn components directly, DON'T recreate them
- Update any old code that is not following the rules of this sysyem 

## 7. REQUIRED STYLING UPDATES
### Critical Changes (High Priority)
- [x] Update `src/app/globals.css` - Change body styling from `@apply bg-white text-gray-900;` to `@apply bg-background text-foreground;`
- [x] Add the missing `font-sans` class to body styling in `globals.css`
- [x] Update `src/app/page.tsx` - Replace `text-gray-900` with `text-foreground` for heading
- [x] Update `src/app/page.tsx` - Replace `text-gray-600` with `text-muted-foreground` for paragraph
- [x] Update `src/app/dashboard/page.tsx` - Replace `text-gray-500` with `text-muted-foreground` for user role text
- [x] Update `src/app/auth/layout.tsx` - Replace `bg-gray-50` with `bg-background` for layout background
- [x] Update `src/app/dashboard/layout.tsx` - Replace `bg-gray-50` with `bg-background` for dashboard layout background
- [x] Update `src/components/ui/button.tsx` - Replace `text-white` with `text-destructive-foreground` for destructive button variant
- [x] Update CSS color variables in `globals.css` to use OKLCH format for Tailwind v4:
  ```css
  --warning: oklch(0.76 0.168 71.5);
  --warning-foreground: oklch(0.985 0 0);
  ```
- [x] Update color definitions in `tailwind.config.ts` for Tailwind v4:
  ```ts
  warning: {
    DEFAULT: "oklch(var(--warning))",
    foreground: "oklch(var(--warning-foreground))",
  },
  ```

### Important Component Updates (Medium Priority)
- [x] Update `src/components/ui/card.tsx` - Change `rounded-xl` to `rounded-lg` to match border radius guidelines
- [x] Update `src/components/ui/dialog.tsx` - Change `rounded-xs` to `rounded-sm` for consistency with design system
- [x] Update `src/components/ui/checkbox.tsx` - Replace `rounded-[4px]` with `rounded-sm` to use semantic radius value
- [x] Standardize focus ring implementation:
  - [x] Replace all `focus-visible:ring-[3px]` with a consistent variable-based approach
  - [x] Update button, input, select, and checkbox components
- [x] Fix inconsistent outline properties - standardize to either `outline-none` or `outline-hidden` across all components
- [x] Fix inconsistent shadow utilities - Standardize to use either `shadow-sm`, `shadow`, or `shadow-md` (avoid `shadow-xs` and `shadow-lg`)
- [x] Fix disabled state inconsistencies:
  - [x] Some components use data-[disabled]:opacity-50
  - [x] Others use data-[disabled=true]:opacity-50
  - [x] Standardize across all components
- [x] Update focus states to use semantic colors - Ensure all focus rings use `ring-ring` instead of direct colors
- [x] Ensure heading elements follow the correct typography scale:
  - [x] Update `src/app/dashboard/page.tsx` - Change `h1` with `text-2xl` to use `text-4xl` (based on guidelines)
  - [x] Update `src/app/dashboard/page.tsx` - Add proper text size class to `h2` (should use `text-xl`)

### Tailwind v4 Specific Updates
- [x] Replace all color opacity handling with Tailwind v4 syntax (e.g., bg-primary/80 instead of alpha-value)
- [x] Ensure all component styles use color functions compatible with OKLCH
- [x] Update any documentation or comments that reference HSL or RGB color formats
- [x] Check any custom color calculation functions or utilities for compatibility with OKLCH
- [x] Verify the correct application of opacity modifiers with the new color format
- [x] Ensure consistent usage of the oklch() function syntax across all styles

### Standardization Efforts (Lower Priority)
- [x] Standardize spacing and layout values:
  - [x] Consistent gap values (currently using gap-1.5, gap-2, gap-4, gap-6)
  - [x] Consistent padding values (px-2, px-3, px-4, py-1, py-1.5, py-2)
- [x] Standardize opacity values:
  - [x] Replace opacity-70 with opacity-50 in Dialog component
  - [x] Use consistent opacity values (opacity-0, opacity-50, opacity-100)
- [x] Standardize text selection styles across components:
  - [x] Apply selection:bg-primary selection:text-primary-foreground consistently to Input, Select, Command, and the new Textarea components
- [x] Standardize border styles:
  - [x] Use consistent border colors (border-input)
- [x] Standardize z-index values across components to use a consistent scale
- [x] Create size token system for consistent dimensions:
  - [x] Use consistent height tokens (h-8, h-9, h-10, h-12, h-16)
  - [x] Use consistent width tokens (w-full, w-10, w-72)
  - [x] Use consistent icon sizes (size-4, size-5)
- [x] Standardize transform properties:
  - [x] Use consistent translate values
- [x] Standardize text decoration:
  - [x] Use underline-offset-4 and hover:underline consistently

### Final Review
- [x] Audit all components to ensure they use semantic class names consistently
- [x] Check for proper implementation of dark mode in component styles
- [x] Ensure consistent typography is used across all components
- [x] Review all border radius values to ensure they match the guidelines
- [x] Verify correct implementation of Tailwind v4 color syntax across all components
