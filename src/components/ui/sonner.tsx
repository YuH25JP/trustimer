import React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ position = "bottom-center", ...props }: ToasterProps) => {
  return (
    <Sonner
      position={position}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-sumi group-[.toaster]:text-paper dark:group-[.toaster]:bg-paper dark:group-[.toaster]:text-sumi group-[.toaster]:border-1.5 group-[.toaster]:border-sumi dark:group-[.toaster]:border-paper group-[.toaster]:shadow-none group-[.toaster]:rounded group-[.toaster]:font-sans group-[.toaster]:text-xs group-[.toaster]:font-medium",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-vermilion group-[.toast]:text-white font-medium group-[.toast]:rounded",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
