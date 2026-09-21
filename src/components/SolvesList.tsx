import React from "react";
import { Solve, Penalty } from "../types";
import { formatTime } from "../lib/stats";
import { Trash2 } from "lucide-react";

interface SolvesListProps {
  solves: Solve[];
  onDeleteSolve: (id: string) => void;
  onUpdatePenalty: (id: string, penalty: Penalty) => void;
  onCopyTime: (timeText: string) => void;
}

export const SolvesList: React.FC<SolvesListProps> = ({
  solves,
  onDeleteSolve,
  onUpdatePenalty,
  onCopyTime,
}) => {
  if (solves.length === 0) {
    return (
      <div className="w-full text-center py-4 text-xs font-mono text-sumi/40 dark:text-paper/40">
        No solves in this session yet. Hold Space to start!
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-sumi/50 dark:text-paper/50 uppercase tracking-wider">
          History ({solves.length})
        </span>
        <span className="text-[11px] font-mono text-sumi/40 dark:text-paper/40">
          Click time to copy | [2] +2 | [D] DNF | [Del] Delete
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {solves.slice(0, 30).map((solve, idx) => {
          const indexNum = solves.length - idx;
          const formatted = formatTime(solve.timeMs, solve.penalty);
          const isLatest = idx === 0;

          return (
            <div
              key={solve.id}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 border-1.5 rounded transition-all text-xs font-mono group ${
                isLatest
                  ? "border-vermilion bg-vermilion/5"
                  : "border-sumi/15 dark:border-white/15 hover:border-sumi/40 dark:hover:border-white/40"
              }`}
            >
              <span className="text-sumi/40 dark:text-paper/40 text-[10px]">
                {indexNum}.
              </span>

              {/* Clickable time to copy */}
              <button
                onClick={() => onCopyTime(formatted.text)}
                title="Click to copy time"
                className={`font-semibold hover:underline ${
                  solve.penalty === "DNF"
                    ? "text-vermilion"
                    : solve.penalty === "PLUS_TWO"
                    ? "text-timer-inspect"
                    : "text-sumi dark:text-paper"
                }`}
              >
                {formatted.text}
              </button>

              {/* Action buttons on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button
                  onClick={() =>
                    onUpdatePenalty(
                      solve.id,
                      solve.penalty === "PLUS_TWO" ? "NONE" : "PLUS_TWO"
                    )
                  }
                  title="Toggle +2"
                  className={`px-1 py-0.5 rounded text-[10px] ${
                    solve.penalty === "PLUS_TWO"
                      ? "bg-vermilion text-white"
                      : "hover:bg-sumi/10 dark:hover:bg-white/10"
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
                  className={`px-1 py-0.5 rounded text-[10px] ${
                    solve.penalty === "DNF"
                      ? "bg-vermilion text-white"
                      : "hover:bg-sumi/10 dark:hover:bg-white/10"
                  }`}
                >
                  DNF
                </button>
                <button
                  onClick={() => onDeleteSolve(solve.id)}
                  title="Delete solve"
                  className="text-sumi/40 dark:text-paper/40 hover:text-vermilion transition-colors p-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
