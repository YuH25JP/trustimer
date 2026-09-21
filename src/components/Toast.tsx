import React from "react";

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="px-4 py-2 bg-sumi text-paper dark:bg-paper dark:text-sumi border-1.5 border-sumi dark:border-paper rounded text-sm font-medium tracking-wide">
        {message}
      </div>
    </div>
  );
};
