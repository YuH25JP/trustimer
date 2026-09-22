import React, { useState } from "react";
import { AverageRecord, formatTime, getTrimmedSolveIds } from "../lib/stats";
import { formatDateTime } from "../lib/dateUtils";
import { Copy, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  if (!record) return null;

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col space-y-4" hideDefaultClose>
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <DialogTitle className="font-mono uppercase font-bold text-base tracking-wider text-sumi dark:text-paper">
                {label}
              </DialogTitle>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-sumi/5 dark:bg-white/10 text-sumi/70 dark:text-paper/70">
                {kind}
              </span>
              <span className="font-mono font-bold text-lg text-vermilion ml-2">
                {averageText}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                title="Copy details to clipboard"
                className="text-xs font-mono gap-1"
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
              </Button>
              <DialogClose className="rounded p-1 text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper transition-colors focus:outline-none focus:ring-1.5 focus:ring-vermilion cursor-pointer">
                <X size={16} />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Solves List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {chronologicalSolves.map((solve, idx) => {
            const isTrimmed = trimmedIds.has(solve.id);
            const formatted = formatTime(solve.timeMs, solve.penalty, true, precision).text;
            const displayTime = isTrimmed ? `(${formatted})` : formatted;
            const dateStr = formatDateTime(solve.createdAt);

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
        <DialogFooter className="flex justify-between items-center text-xs font-mono text-sumi/50 dark:text-paper/50">
          <span>
            {chronologicalSolves.length} solves
            {trimmedIds.size > 0 && ` (${trimmedIds.size} trimmed)`}
          </span>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
