import React from "react";
import { TimerState, Penalty, TimerDisplayMode } from "../types";
import { formatTime } from "../lib/stats";

interface TimerDisplayProps {
  timerState: TimerState;
  displayTimeMs: number;
  inspectionSeconds: number;
  inspectionPenalty: Penalty;
  timerUpdateMode: TimerDisplayMode;
  lastSolvePenalty: Penalty;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerState,
  displayTimeMs,
  inspectionSeconds,
  inspectionPenalty,
  timerUpdateMode,
  lastSolvePenalty,
}) => {
  // Determine color according to state
  const getColorClass = () => {
    switch (timerState) {
      case "HOLDING":
      case "INSPECTION_HOLDING":
        return "text-timer-hold";
      case "READY":
      case "INSPECTION_READY":
        return "text-timer-ready";
      case "INSPECTING":
        if (inspectionSeconds <= 0) return "text-timer-hold";
        if (inspectionSeconds <= 3) return "text-vermilion";
        if (inspectionSeconds <= 7) return "text-timer-inspect";
        return "text-sumi dark:text-paper";
      case "RUNNING":
      case "STOPPED":
      case "COOLDOWN":
      case "IDLE":
      default:
        return "text-sumi dark:text-paper";
    }
  };

  // Determine what string to render
  const renderContent = () => {
    if (timerState === "INSPECTING" || timerState === "INSPECTION_HOLDING" || timerState === "INSPECTION_READY") {
      if (inspectionSeconds <= 0 && inspectionSeconds >= -2) {
        return "+2";
      }
      if (inspectionSeconds < -2) {
        return "DNF";
      }
      return String(inspectionSeconds);
    }

    if (timerState === "RUNNING") {
      if (timerUpdateMode === "none") {
        return "•••";
      }
      if (timerUpdateMode === "seconds") {
        return formatTime(displayTimeMs, "NONE", false).text;
      }
      return formatTime(displayTimeMs, "NONE", true).text;
    }

    const penalty = timerState === "STOPPED" || timerState === "COOLDOWN" ? lastSolvePenalty : "NONE";
    const formatted = formatTime(displayTimeMs, penalty, true);
    return formatted.text;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center select-none py-12">
      <div
        className={`font-mono font-bold tracking-tight transition-colors duration-75 text-center ${
          timerState === "INSPECTING"
            ? "text-8xl md:text-9xl lg:text-[10rem]"
            : "text-7xl md:text-8xl lg:text-9xl"
        } ${getColorClass()}`}
      >
        {renderContent()}
      </div>

      {/* Sub-label for status / helper */}
      <div className="h-6 mt-4 text-xs font-mono tracking-wider text-sumi/50 dark:text-paper/50 uppercase">
        {timerState === "IDLE" && "Hold Space to Start"}
        {timerState === "HOLDING" && "Hold..."}
        {timerState === "READY" && "Release to Start!"}
        {timerState === "INSPECTING" && "Inspection"}
        {timerState === "INSPECTION_HOLDING" && "Hold..."}
        {timerState === "INSPECTION_READY" && "Release to Solve!"}
        {timerState === "RUNNING" && (timerUpdateMode === "none" ? "Focus" : "Solving")}
        {timerState === "STOPPED" && (inspectionPenalty !== "NONE" ? `Penalty: ${inspectionPenalty}` : "Done")}
      </div>
    </div>
  );
};
