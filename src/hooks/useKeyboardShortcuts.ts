import { useEffect } from "react";
import { Solve, Penalty } from "../types";
import { formatTime } from "../lib/stats";

interface UseKeyboardShortcutsProps {
  solves: Solve[];
  onDeleteLastSolve: () => void;
  onTogglePenaltyLastSolve: (penalty: Penalty) => void;
  onRefreshScramble: () => void;
  onCopyTime: (timeText: string) => void;
  isTimerActive: boolean;
}

export function useKeyboardShortcuts({
  solves,
  onDeleteLastSolve,
  onTogglePenaltyLastSolve,
  onRefreshScramble,
  onCopyTime,
  isTimerActive,
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
          const formatted = formatTime(latest.timeMs, latest.penalty);
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

      // Delete / Backspace: Delete latest solve
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onDeleteLastSolve();
        return;
      }

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
    onDeleteLastSolve,
    onTogglePenaltyLastSolve,
    onRefreshScramble,
    onCopyTime,
    isTimerActive,
  ]);
}
