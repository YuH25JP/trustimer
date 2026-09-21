import React from "react";
import { Solve, Penalty } from "../types";
import { formatTime } from "../lib/stats";
import { Trash2, Copy } from "lucide-react";

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
                <button
                  onClick={() =>
                    onUpdatePenalty(
                      solve.id,
                      solve.penalty === "PLUS_TWO" ? "NONE" : "PLUS_TWO"
                    )
                  }
                  title="Toggle +2"
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border-1.5 transition-colors ${
                    solve.penalty === "PLUS_TWO"
                      ? "border-vermilion bg-vermilion text-white"
                      : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white text-sumi/70 dark:text-paper/70"
                  }`}
                >
                  +2
                </button>
                <button
                  onClick={() =>
                    onUpdatePenalty(
                      solve.id,
                      solve.penalty === "DNF" ? "NONE" : "DNF"
                    )
                  }
                  title="Toggle DNF"
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium border-1.5 transition-colors ${
                    solve.penalty === "DNF"
                      ? "border-vermilion bg-vermilion text-white"
                      : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white text-sumi/70 dark:text-paper/70"
                  }`}
                >
                  DNF
                </button>
                <button
                  onClick={() => onDeleteSolve(solve.id)}
                  title="Delete solve"
                  className="text-sumi/40 dark:text-paper/40 hover:text-vermilion transition-colors p-1 rounded hover:bg-sumi/10 dark:hover:bg-white/10"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
