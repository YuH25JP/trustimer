import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, onClick, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        ref={ref}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (!disabled) {
            onCheckedChange?.(!checked);
          }
        }}
        className={cn(
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-1.5 p-0.5 transition-colors duration-120 ease-out focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-vermilion disabled:cursor-not-allowed disabled:opacity-50 shadow-none",
          checked
            ? "bg-vermilion border-vermilion"
            : "bg-sumi/10 dark:bg-white/10 border-sumi/30 dark:border-white/30",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-3.5 w-3.5 rounded-full bg-paper dark:bg-white shadow-none transition-transform duration-120 ease-out",
            checked ? "translate-x-[15px]" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
