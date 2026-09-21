import React from "react";
import { SessionStats, formatTime } from "../lib/stats";

interface StatsPanelProps {
  stats: SessionStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const formatAverage = (val: number | null) => {
    if (val === null) return "-";
    if (val === -1) return "DNF";
    return formatTime(val, "NONE", true).text;
  };

  const statItems = [
    { label: "Solves", current: stats.totalCount.toString(), best: null },
    {
      label: "Single",
      current: stats.bestSingle ? formatTime(stats.bestSingle.timeMs, stats.bestSingle.penalty).text : "-",
      best: stats.worstSingle ? `Worst: ${formatTime(stats.worstSingle.timeMs, stats.worstSingle.penalty).text}` : null,
    },
    {
      label: "mo3",
      current: formatAverage(stats.currentMo3),
      best: stats.bestMo3 !== null ? `Best: ${formatAverage(stats.bestMo3)}` : null,
    },
    {
      label: "ao5",
      current: formatAverage(stats.currentAo5),
      best: stats.bestAo5 !== null ? `Best: ${formatAverage(stats.bestAo5)}` : null,
    },
    {
      label: "ao12",
      current: formatAverage(stats.currentAo12),
      best: stats.bestAo12 !== null ? `Best: ${formatAverage(stats.bestAo12)}` : null,
    },
    {
      label: "ao100",
      current: formatAverage(stats.currentAo100),
      best: stats.bestAo100 !== null ? `Best: ${formatAverage(stats.bestAo100)}` : null,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-2">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border-1.5 border-sumi/10 dark:border-white/10 rounded-lg p-3 bg-sumi/[0.02] dark:bg-white/[0.02]">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-[11px] font-mono uppercase tracking-wider text-sumi/50 dark:text-paper/50">
              {item.label}
            </div>
            <div className="font-mono font-semibold text-sm sm:text-base text-sumi dark:text-paper mt-0.5">
              {item.current}
            </div>
            {item.best && (
              <div className="text-[10px] font-mono text-sumi/40 dark:text-paper/40 truncate">
                {item.best}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
