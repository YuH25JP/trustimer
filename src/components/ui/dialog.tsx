import * as React from "react";
import { useEffect, useState, useContext, createContext } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
});

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({
  open = false,
  onOpenChange = () => {},
  children,
}) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
> = ({ onClick, children, ...props }) => {
  const { onOpenChange } = useContext(DialogContext);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(true);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, children, ...props }, ref) => {
  const { onOpenChange } = useContext(DialogContext);
  return (
    <button
      type="button"
      ref={ref}
      className={cn(
        "rounded-sm text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper transition-colors focus:outline-none focus:ring-1.5 focus:ring-vermilion disabled:pointer-events-none cursor-pointer",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        onOpenChange(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
DialogClose.displayName = "DialogClose";

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideDefaultClose?: boolean;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, hideDefaultClose = false, ...props }, ref) => {
    const { open, onOpenChange } = useContext(DialogContext);
    const [mounted, setMounted] = useState(open);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      if (open) {
        setMounted(true);
        const raf = requestAnimationFrame(() => {
          setVisible(true);
        });
        return () => cancelAnimationFrame(raf);
      } else {
        setVisible(false);
        const timer = setTimeout(() => {
          setMounted(false);
        }, 120);
        return () => clearTimeout(timer);
      }
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange]);

    if (!mounted) return null;

    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity duration-150 ease-out",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      >
        <div
          ref={ref}
          className={cn(
            "relative z-50 grid w-full max-w-lg gap-4 border-1.5 border-sumi dark:border-paper/40 bg-paper dark:bg-[#18181b] p-6 rounded-lg shadow-none transition-all duration-150 ease-out origin-center",
            visible
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-1",
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
          {!hideDefaultClose && (
            <DialogClose className="absolute right-6 top-6 h-6 w-6 flex items-center justify-center rounded-sm text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper transition-colors focus:outline-none focus:ring-1.5 focus:ring-vermilion disabled:pointer-events-none cursor-pointer">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          )}
        </div>
      </div>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-left border-b-1.5 border-sumi/10 dark:border-white/10 pb-3",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2 border-t-1.5 border-sumi/10 dark:border-white/10",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-base font-semibold leading-none tracking-tight text-foreground font-sans",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-sumi/60 dark:text-paper/60", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/40", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
