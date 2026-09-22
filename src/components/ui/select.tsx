import * as React from "react";
import { useState, useRef, useEffect, useContext, createContext, useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  labels: Record<string, React.ReactNode>;
  registerLabel: (value: string, label: React.ReactNode) => void;
}

const SelectContext = createContext<SelectContextValue>({
  open: false,
  setOpen: () => {},
  labels: {},
  registerLabel: () => {},
});

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function extractLabelsFromChildren(children: React.ReactNode): Record<string, React.ReactNode> {
  const extracted: Record<string, React.ReactNode> = {};

  const traverse = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;
      const props = child.props as Record<string, unknown>;
      if (props && typeof props.value === "string" && props.children !== undefined) {
        extracted[props.value] = props.children as React.ReactNode;
      }
      if (props && props.children) {
        traverse(props.children as React.ReactNode);
      }
    });
  };

  traverse(children);
  return extracted;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pre-extract labels synchronously from children so initial values (e.g. 3x3x3, Main) display immediately
  const initialLabels = useMemo(() => extractLabelsFromChildren(children), [children]);
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, React.ReactNode>>({});

  const registerLabel = React.useCallback((val: string, label: React.ReactNode) => {
    setDynamicLabels((prev) => {
      if (prev[val] === label) return prev;
      return { ...prev, [val]: label };
    });
  }, []);

  const mergedLabels = useMemo(
    () => ({ ...initialLabels, ...dynamicLabels }),
    [initialLabels, dynamicLabels]
  );

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        labels: mergedLabels,
        registerLabel,
      }}
    >
      <div ref={containerRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useContext(SelectContext);

    return (
      <button
        type="button"
        ref={ref}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-8 w-full items-center justify-between rounded border-1.5 border-sumi/20 dark:border-white/20 bg-paper dark:bg-paper-dark px-2.5 py-1.5 text-sm font-mono text-sumi dark:text-paper shadow-none hover:border-sumi dark:hover:border-white focus:outline-none focus:ring-1.5 focus:ring-vermilion disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-colors cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 opacity-60 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder = "Select..." }) => {
  const { value, labels } = useContext(SelectContext);
  const display = value !== undefined && labels[value] !== undefined ? labels[value] : placeholder;

  return <span className="truncate">{display}</span>;
};

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useContext(SelectContext);

    return (
      <div
        ref={ref}
        className={cn(
          "absolute left-0 top-[calc(100%+4px)] z-50 max-h-60 min-w-[8rem] w-full overflow-y-auto rounded-md border-1.5 border-sumi dark:border-paper/40 bg-paper dark:bg-[#18181b] text-foreground shadow-none p-1 origin-top transition-all duration-120 ease-out",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none invisible",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen, registerLabel } =
      useContext(SelectContext);

    useEffect(() => {
      registerLabel(value, children);
    }, [value, children, registerLabel]);

    const isSelected = selectedValue === value;

    return (
      <div
        ref={ref}
        onClick={() => {
          onValueChange?.(value);
          setOpen(false);
        }}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded py-1.5 pl-2 pr-7 text-xs font-mono outline-none hover:bg-sumi/10 dark:hover:bg-white/10 text-foreground transition-colors",
          isSelected && "font-semibold bg-sumi/5 dark:bg-white/5",
          className
        )}
        {...props}
      >
        {isSelected && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-3.5 w-3.5 text-vermilion" />
          </span>
        )}
        <span className="truncate">{children}</span>
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

const SelectLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "px-2 py-1.5 text-xs font-semibold text-sumi/60 dark:text-paper/60",
      className
    )}
    {...props}
  />
);

const SelectSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("-mx-1 my-1 h-px bg-sumi/10 dark:bg-white/10", className)}
    {...props}
  />
);

const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
