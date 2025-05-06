import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 dark:bg-[#232326] dark:text-white dark:hover:bg-[#2a2a2c]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-red-900/30 dark:text-red-400 dark:border dark:border-red-900/50 dark:hover:bg-red-900/40",
        outline:
          "border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:bg-[#232326] dark:border-[#2a2a2c] dark:text-[#a0a0a0] dark:hover:bg-[#2a2a2c]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 dark:bg-[#1e1e20] dark:text-[#a0a0a0] dark:hover:bg-[#232326]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-[#232326] dark:text-[#a0a0a0]",
        link: "text-primary underline-offset-4 hover:underline dark:text-[#a0a0a0]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }
>((props, ref) => {
  const { className, variant, size, asChild = false, ...otherProps } = props;
  
  if (asChild) {
    return (
      <Slot 
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...otherProps}
      />
    )
  }
  
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...otherProps}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
