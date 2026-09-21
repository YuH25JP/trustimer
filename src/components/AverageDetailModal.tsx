import React, { useEffect, useState } from "react";
import { AverageRecord, formatTime, getTrimmedSolveIds } from "../lib/stats";
import { X, Copy, Check } from "lucide-react";

interface AverageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  kind: "Current" | "Best" | "Worst";
  record: AverageRecord | null;
  precision?: 2 | 3;
}

export const AverageDetailModal: React.FC<AverageDetailModalProps> = ({
  isOpen,
  onClose,
  label,
  kind,
  record,
  precision = 3,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  // Record.solves is stored newest-first. Reverse to chronological order (1st solve to Nth solve).
  const chronologicalSolves = [...record.solves].reverse();
  const trimmedIds = getTrimmedSolveIds(record.solves, record.solves.length);

  const averageText =
    record.value === -1
      ? "DNF"
      : formatTime(record.value, "NONE", true, precision).text;

  const handleCopy = async () => {
    const lines = [
      `Trustimer - ${label.toUpperCase()} (${kind}): ${averageText}`,
      "",
    ];

    chronologicalSolves.forEach((solve, idx) => {
      const formatted = formatTime(solve.timeMs, solve.penalty, true, precision).text;
      const isTrimmed = trimmedIds.has(solve.id);
      const timeStr = isTrimmed ? `(${formatted})` : formatted;
      lines.push(`${idx + 1}. ${timeStr.padEnd(10, " ")} ${solve.scramble}`);
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy average detail:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-paper dark:bg-[#1a1a1e] border-1.5 border-sumi dark:border-paper rounded-lg p-5 w-full max-w-xl max-h-[85vh] flex flex-col space-y-4 shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-1.5 border-sumi/10 dark:border-white/10 pb-3">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono uppercase font-bold text-base tracking-wider text-sumi dark:text-paper">
              {label}
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-sumi/5 dark:bg-white/10 text-sumi/70 dark:text-paper/70">
              {kind}
            </span>
            <span className="font-mono font-bold text-lg text-vermilion ml-2">
              {averageText}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              title="Copy details to clipboard"
              className="p-1.5 border-1.5 border-sumi/20 dark:border-white/20 rounded hover:border-sumi dark:hover:border-white text-sumi/70 dark:text-paper/70 hover:text-sumi dark:hover:text-paper transition-colors flex items-center gap-1 text-xs font-mono"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Solves List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {chronologicalSolves.map((solve, idx) => {
            const isTrimmed = trimmedIds.has(solve.id);
            const formatted = formatTime(solve.timeMs, solve.penalty, true, precision).text;
            const displayTime = isTrimmed ? `(${formatted})` : formatted;
            const dateStr = new Date(solve.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={solve.id}
                className={`p-2.5 rounded border-1.5 transition-colors ${
                  isTrimmed
                    ? "border-sumi/10 dark:border-white/10 bg-sumi/[0.02] dark:bg-white/[0.02] opacity-70"
                    : "border-sumi/20 dark:border-white/20 bg-sumi/[0.04] dark:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sumi/40 dark:text-paper/40 font-semibold w-6">
                      {idx + 1}.
                    </span>
                    <span
                      className={`font-semibold ${
                        isTrimmed
                          ? "text-sumi/60 dark:text-paper/60"
                          : "text-sumi dark:text-paper"
                      }`}
                    >
                      {displayTime}
                    </span>
                    {solve.penalty === "PLUS_TWO" && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        +2
                      </span>
                    )}
                    {solve.penalty === "DNF" && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-vermilion/10 text-vermilion border border-vermilion/30 font-bold">
                        DNF
                      </span>
                    )}
                    {isTrimmed && (
                      <span className="text-[10px] text-sumi/40 dark:text-paper/40">
                        (trimmed)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-sumi/40 dark:text-paper/40">
                    {dateStr}
                  </span>
                </div>
                <div className="font-mono text-xs text-sumi/60 dark:text-paper/60 truncate select-all pl-8">
                  {solve.scramble}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t-1.5 border-sumi/10 dark:border-white/10 text-xs font-mono text-sumi/50 dark:text-paper/50">
          <span>
            {chronologicalSolves.length} solves
            {trimmedIds.size > 0 && ` (${trimmedIds.size} trimmed)`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-sumi text-paper dark:bg-paper dark:text-sumi rounded hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
