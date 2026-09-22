import { useEffect } from "react";
import { Solve, Penalty } from "../types";
import { formatTime } from "../lib/stats";

interface UseKeyboardShortcutsProps {
  solves: Solve[];
  onTogglePenaltyLastSolve: (penalty: Penalty) => void;
  onRefreshScramble: () => void;
  onCopyTime: (timeText: string) => void;
  isTimerActive: boolean;
  precision?: 2 | 3;
}

export function useKeyboardShortcuts({
  solves,
  onTogglePenaltyLastSolve,
  onRefreshScramble,
  onCopyTime,
  isTimerActive,
  precision = 3,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if an input/textarea/select is focused
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      // Don't trigger shortcuts while timer is active (holding, running, inspecting)
      if (isTimerActive) return;

      // Ctrl+C: Copy latest solve time
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (solves.length > 0) {
          e.preventDefault();
          const latest = solves[0];
          const formatted = formatTime(latest.timeMs, latest.penalty, true, precision);
          onCopyTime(formatted.text);
        }
        return;
      }

      // Alt+N: New Scramble
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onRefreshScramble();
        return;
      }

      // Solves must exist for the following shortcuts
      if (solves.length === 0) return;
      const latest = solves[0];

      // 2: Toggle +2 penalty
      if (e.key === "2") {
        e.preventDefault();
        const nextPenalty: Penalty =
          latest.penalty === "PLUS_TWO" ? "NONE" : "PLUS_TWO";
        onTogglePenaltyLastSolve(nextPenalty);
        return;
      }

      // d / D: Toggle DNF penalty
      if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        const nextPenalty: Penalty =
          latest.penalty === "DNF" ? "NONE" : "DNF";
        onTogglePenaltyLastSolve(nextPenalty);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    solves,
    onTogglePenaltyLastSolve,
    onRefreshScramble,
    onCopyTime,
    isTimerActive,
  ]);
}
