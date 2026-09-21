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
      <div className="w-full text-center py-6 text-sm font-mono text-sumi/40 dark:text-paper/40">
        No solves in this session yet. Hold Space to start!
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-mono font-semibold text-sumi/70 dark:text-paper/70 uppercase tracking-wider">
          History ({solves.length})
        </span>
        <span className="text-xs font-mono text-sumi/50 dark:text-paper/50 hidden sm:inline">
          Click time or copy button | [2] +2 | [D] DNF | [Del] Delete
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        {solves.slice(0, 30).map((solve, idx) => {
          const indexNum = solves.length - idx;
          const formatted = formatTime(solve.timeMs, solve.penalty, true, precision);
          const isLatest = idx === 0;

          return (
            <div
              key={solve.id}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 border-1.5 rounded-lg transition-all font-mono group select-none shadow-sm ${
                isLatest
                  ? "border-vermilion bg-vermilion/[0.07] ring-1 ring-vermilion/30"
                  : "border-sumi/20 dark:border-white/20 bg-sumi/[0.02] dark:bg-white/[0.02] hover:border-sumi/50 dark:hover:border-white/50"
              }`}
            >
              {/* Solve Index */}
              <span className="text-sumi/40 dark:text-paper/40 text-xs font-medium min-w-[20px]">
                #{indexNum}
              </span>

              {/* Clickable time with copy hover */}
              <button
                onClick={() => onCopyTime(formatted.text)}
                title="Click to copy time"
                className={`flex items-center gap-1.5 font-bold text-base sm:text-lg tracking-tight hover:opacity-80 transition-opacity cursor-pointer px-1 py-0.5 rounded hover:bg-sumi/5 dark:hover:bg-white/5 ${
                  solve.penalty === "DNF"
                    ? "text-vermilion font-semibold"
                    : solve.penalty === "PLUS_TWO"
                    ? "text-timer-inspect"
                    : "text-sumi dark:text-paper"
                }`}
              >
                <span>{formatted.text}</span>
                <Copy size={13} className="opacity-0 group-hover:opacity-60 transition-opacity text-sumi/60 dark:text-paper/60" />
              </button>

              {/* Action buttons (always slightly visible or on hover) */}
              <div className="flex items-center gap-1 pl-1 border-l-1.5 border-sumi/10 dark:border-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    onUpdatePenalty(
                      solve.id,
                      solve.penalty === "PLUS_TWO" ? "NONE" : "PLUS_TWO"
                    )
                  }
                  title="Toggle +2"
                  className={`px-1.5 py-0.5 rounded text-xs font-medium border-1.5 transition-colors ${
                    solve.penalty === "PLUS_TWO"
                      ? "border-vermilion bg-vermilion text-white"
                      : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white"
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
                  className={`px-1.5 py-0.5 rounded text-xs font-medium border-1.5 transition-colors ${
                    solve.penalty === "DNF"
                      ? "border-vermilion bg-vermilion text-white"
                      : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white"
                  }`}
                >
                  DNF
                </button>
                <button
                  onClick={() => onDeleteSolve(solve.id)}
                  title="Delete solve"
                  className="text-sumi/40 dark:text-paper/40 hover:text-vermilion transition-colors p-1 rounded hover:bg-sumi/10 dark:hover:bg-white/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
