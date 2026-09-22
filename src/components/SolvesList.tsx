import React, { useState } from "react";
import { Solve, Penalty } from "../types";
import { formatTime } from "../lib/stats";
import { Trash2, Copy, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface SolvesListProps {
  solves: Solve[];
  onDeleteSolve: (id: string) => void;
  onUpdatePenalty: (id: string, penalty: Penalty) => void;
  onCopyTime: (timeText: string) => void;
  precision?: 2 | 3;
}

export const SolvesList: React.FC<SolvesListProps> = ({
  solves,
  onDeleteSolve,
  onUpdatePenalty,
  onCopyTime,
  precision = 3,
}) => {
  const [solveToDelete, setSolveToDelete] = useState<Solve | null>(null);
  if (solves.length === 0) {
    return (
      <div className="h-full border-1.5 border-sumi/10 dark:border-white/10 rounded-lg p-4 bg-sumi/[0.02] dark:bg-white/[0.02] flex flex-col items-center justify-center text-center font-mono text-xs text-sumi/40 dark:text-paper/40 select-none">
        No solves yet.
        <br />
        Hold Space to start!
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-1.5 border-sumi/10 dark:border-white/10 rounded-lg bg-sumi/[0.02] dark:bg-white/[0.02] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b-1.5 border-sumi/10 dark:border-white/10 bg-sumi/[0.02] dark:bg-white/[0.02] select-none">
        <span className="text-xs font-mono font-semibold text-sumi/70 dark:text-paper/70 uppercase tracking-wider">
          History ({solves.length})
        </span>
        <span className="text-[10px] font-mono text-sumi/40 dark:text-paper/40">
          [2] +2 | [D] DNF
        </span>
      </div>

      {/* Vertical scrollable list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
        {solves.map((solve, idx) => {
          const indexNum = solves.length - idx;
          const formatted = formatTime(solve.timeMs, solve.penalty, true, precision);
          const isLatest = idx === 0;

          return (
            <div
              key={solve.id}
              className={`flex items-center justify-between px-2.5 py-1.5 border-1.5 rounded transition-all font-mono group select-none ${
                isLatest
                  ? "border-vermilion/80 bg-vermilion/[0.06]"
                  : "border-sumi/10 dark:border-white/10 bg-paper dark:bg-paper-dark hover:border-sumi/30 dark:hover:border-white/30"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Solve index */}
                <span className="text-sumi/40 dark:text-paper/40 text-[11px] font-medium w-7 shrink-0 text-left">
                  #{indexNum}
                </span>

                {/* Clickable time with copy */}
                <button
                  onClick={() => onCopyTime(formatted.text)}
                  title="Click to copy time"
                  className={`flex items-center gap-1 font-bold text-sm tracking-tight hover:opacity-80 transition-opacity cursor-pointer px-1 py-0.5 rounded hover:bg-sumi/5 dark:hover:bg-white/5 ${
                    solve.penalty === "DNF"
                      ? "text-vermilion"
                      : solve.penalty === "PLUS_TWO"
                      ? "text-timer-inspect"
                      : "text-sumi dark:text-paper"
                  }`}
                >
                  <span className="truncate">{formatted.text}</span>
                  <Copy
                    size={11}
                    className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0 text-sumi/60 dark:text-paper/60"
                  />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 pl-1 shrink-0">
                <Button
                  size="sm"
                  variant={solve.penalty === "PLUS_TWO" ? "vermilion" : "outline"}
                  onClick={() =>
                    onUpdatePenalty(
                      solve.id,
                      solve.penalty === "PLUS_TWO" ? "NONE" : "PLUS_TWO"
                    )
                  }
                  title="Toggle +2"
                  className="h-5 px-1.5 text-[10px] font-medium"
                >
                  +2
                </Button>
                <Button
                  size="sm"
                  variant={solve.penalty === "DNF" ? "vermilion" : "outline"}
                  onClick={() =>
                    onUpdatePenalty(
                      solve.id,
                      solve.penalty === "DNF" ? "NONE" : "DNF"
                    )
                  }
                  title="Toggle DNF"
                  className="h-5 px-1.5 text-[10px] font-medium"
                >
                  DNF
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setSolveToDelete(solve)}
                  title="Delete solve"
                  className="h-5 w-5 text-sumi/40 dark:text-paper/40 hover:text-vermilion hover:bg-sumi/10 dark:hover:bg-white/10"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!solveToDelete}
        onOpenChange={(open) => !open && setSolveToDelete(null)}
      >
        <DialogContent className="w-96 max-w-[calc(100vw-2rem)] space-y-4 overflow-hidden" hideDefaultClose>
          <DialogHeader className="flex flex-row items-center justify-between border-b-1.5 border-sumi/10 dark:border-white/10 pb-3 space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-vermilion/10 text-vermilion">
                <AlertTriangle size={16} />
              </div>
              <DialogTitle className="text-sm font-semibold">
                Delete Solve
              </DialogTitle>
            </div>
            <DialogClose className="rounded p-1 text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper transition-colors focus:outline-none focus:ring-1.5 focus:ring-vermilion cursor-pointer">
              <X size={16} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          {solveToDelete && (
            <div className="min-w-0 space-y-3 font-mono text-xs">
              <div className="min-w-0 p-2.5 rounded border-1.5 border-sumi/15 dark:border-white/15 bg-sumi/[0.03] dark:bg-white/[0.03] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sumi/50 dark:text-paper/50">
                    Solve #{solves.length - solves.findIndex((s) => s.id === solveToDelete.id)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-sumi dark:text-paper">
                      {formatTime(solveToDelete.timeMs, solveToDelete.penalty, true, precision).text}
                    </span>
                    {solveToDelete.penalty === "PLUS_TWO" && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        +2
                      </span>
                    )}
                    {solveToDelete.penalty === "DNF" && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-vermilion/10 text-vermilion border border-vermilion/30 font-bold">
                        DNF
                      </span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 pt-1.5 border-t border-sumi/10 dark:border-white/10">
                  <div className="text-[11px] text-sumi/70 dark:text-paper/70 overflow-x-auto whitespace-nowrap scrollbar-thin py-1 px-1.5 bg-sumi/[0.04] dark:bg-white/[0.04] rounded border border-sumi/10 dark:border-white/10 select-all font-mono">
                    {solveToDelete.scramble}
                  </div>
                </div>
              </div>

              <p className="font-sans text-xs text-sumi/70 dark:text-paper/70 leading-relaxed">
                Are you sure you want to delete this solve? This action cannot be undone.
              </p>
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSolveToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (solveToDelete) {
                  onDeleteSolve(solveToDelete.id);
                  setSolveToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
