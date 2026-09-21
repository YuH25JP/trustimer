import React from "react";
import { RefreshCw, Copy } from "lucide-react";

interface ScrambleDisplayProps {
  scramble: string;
  loading: boolean;
  onRefresh: () => void;
  onCopy: () => void;
}

export const ScrambleDisplay: React.FC<ScrambleDisplayProps> = ({
  scramble,
  loading,
  onRefresh,
  onCopy,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-4 flex flex-col items-center justify-center relative group">
      <div
        onClick={onRefresh}
        title="Click to generate new scramble (or press Alt+N)"
        className="font-mono text-center text-lg md:text-xl lg:text-2xl font-medium tracking-wide leading-relaxed cursor-pointer hover:opacity-80 transition-opacity select-none py-2 px-4 rounded"
      >
        {loading ? (
          <span className="text-sumi/40 dark:text-paper/40 animate-pulse">Generating scramble...</span>
        ) : (
          scramble || "Ready"
        )}
      </div>

      <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="New Scramble (Alt+N)"
          className="flex items-center gap-1 text-xs px-2 py-1 text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper hover:bg-sumi/5 dark:hover:bg-white/5 rounded transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>New</span>
        </button>
        <button
          onClick={onCopy}
          title="Copy Scramble"
          className="flex items-center gap-1 text-xs px-2 py-1 text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper hover:bg-sumi/5 dark:hover:bg-white/5 rounded transition-colors"
        >
          <Copy size={13} />
          <span>Copy</span>
        </button>
      </div>
    </div>
  );
};
