import React from "react";
import { SessionStats, formatTime } from "../lib/stats";

interface StatsPanelProps {
  stats: SessionStats;
  precision?: 2 | 3;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, precision = 3 }) => {
  const formatAverage = (val: number | null) => {
    if (val === null) return "-";
    if (val === -1) return "DNF";
    return formatTime(val, "NONE", true, precision).text;
  };

  const formatSingle = (solve: typeof stats.currentSingle) => {
    if (!solve) return "-";
    return formatTime(solve.timeMs, solve.penalty, true, precision).text;
  };

  const formatBestWorst = (best: string, worst: string) => {
    if (best === "-" && worst === "-") return "-";
    return `${best} / ${worst}`;
  };

  const statItems = [
    {
      label: "Solves",
      current: stats.totalCount.toString(),
      sub: "-",
    },
    {
      label: "Single",
      current: formatSingle(stats.currentSingle),
      sub: formatBestWorst(formatSingle(stats.bestSingle), formatSingle(stats.worstSingle)),
    },
    {
      label: "mo3",
      current: formatAverage(stats.currentMo3),
      sub: formatBestWorst(formatAverage(stats.bestMo3), formatAverage(stats.worstMo3)),
    },
    {
      label: "ao5",
      current: formatAverage(stats.currentAo5),
      sub: formatBestWorst(formatAverage(stats.bestAo5), formatAverage(stats.worstAo5)),
    },
    {
      label: "ao12",
      current: formatAverage(stats.currentAo12),
      sub: formatBestWorst(formatAverage(stats.bestAo12), formatAverage(stats.worstAo12)),
    },
    {
      label: "ao100",
      current: formatAverage(stats.currentAo100),
      sub: formatBestWorst(formatAverage(stats.bestAo100), formatAverage(stats.worstAo100)),
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
            <div className="text-[10px] font-mono text-sumi/40 dark:text-paper/40 truncate">
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
