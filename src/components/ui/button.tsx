import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-vermilion disabled:pointer-events-none disabled:opacity-50 select-none shadow-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-vermilion hover:text-white dark:hover:bg-vermilion dark:hover:text-white transition-colors",
        destructive:
          "bg-vermilion text-white hover:bg-vermilion-hover transition-colors",
        outline:
          "border-1.5 border-sumi/20 dark:border-white/20 bg-transparent text-foreground hover:border-sumi dark:hover:border-white hover:bg-accent/40 transition-colors",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors",
        ghost:
          "hover:bg-sumi/5 dark:hover:bg-white/5 hover:text-foreground transition-colors",
        vermilion:
          "bg-vermilion text-white hover:bg-vermilion-hover transition-colors",
        link:
          "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3.5 py-1.5 rounded text-xs",
        sm: "h-7 px-2.5 text-xs rounded",
        lg: "h-9 px-4 text-sm rounded-md",
        icon: "h-8 w-8 rounded",
        "icon-sm": "h-6 w-6 rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
