import React, { useState } from "react";
import { SessionStats, formatTime, AverageRecord } from "../lib/stats";
import { AverageDetailModal } from "./AverageDetailModal";

interface StatsPanelProps {
  stats: SessionStats;
  precision?: 2 | 3;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, precision = 3 }) => {
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    label: string;
    kind: "Current" | "Best" | "Worst";
    record: AverageRecord | null;
  }>({
    isOpen: false,
    label: "",
    kind: "Current",
    record: null,
  });

  const openDetail = (
    label: string,
    kind: "Current" | "Best" | "Worst",
    record: AverageRecord | null
  ) => {
    if (!record) return;
    setDetailModal({
      isOpen: true,
      label,
      kind,
      record,
    });
  };

  const closeDetail = () => {
    setDetailModal((prev) => ({ ...prev, isOpen: false }));
  };

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
      isAverage: false,
      best: "-",
      worst: "-",
      currentRecord: null,
      bestRecord: null,
      worstRecord: null,
    },
    {
      label: "Single",
      current: formatSingle(stats.currentSingle),
      sub: formatBestWorst(formatSingle(stats.bestSingle), formatSingle(stats.worstSingle)),
      isAverage: false,
      best: formatSingle(stats.bestSingle),
      worst: formatSingle(stats.worstSingle),
      currentRecord: null,
      bestRecord: null,
      worstRecord: null,
    },
    {
      label: "mo3",
      current: formatAverage(stats.currentMo3),
      sub: formatBestWorst(formatAverage(stats.bestMo3), formatAverage(stats.worstMo3)),
      isAverage: true,
      best: formatAverage(stats.bestMo3),
      worst: formatAverage(stats.worstMo3),
      currentRecord: stats.currentMo3Record,
      bestRecord: stats.bestMo3Record,
      worstRecord: stats.worstMo3Record,
    },
    {
      label: "ao5",
      current: formatAverage(stats.currentAo5),
      sub: formatBestWorst(formatAverage(stats.bestAo5), formatAverage(stats.worstAo5)),
      isAverage: true,
      best: formatAverage(stats.bestAo5),
      worst: formatAverage(stats.worstAo5),
      currentRecord: stats.currentAo5Record,
      bestRecord: stats.bestAo5Record,
      worstRecord: stats.worstAo5Record,
    },
    {
      label: "ao12",
      current: formatAverage(stats.currentAo12),
      sub: formatBestWorst(formatAverage(stats.bestAo12), formatAverage(stats.worstAo12)),
      isAverage: true,
      best: formatAverage(stats.bestAo12),
      worst: formatAverage(stats.worstAo12),
      currentRecord: stats.currentAo12Record,
      bestRecord: stats.bestAo12Record,
      worstRecord: stats.worstAo12Record,
    },
    {
      label: "ao100",
      current: formatAverage(stats.currentAo100),
      sub: formatBestWorst(formatAverage(stats.bestAo100), formatAverage(stats.worstAo100)),
      isAverage: true,
      best: formatAverage(stats.bestAo100),
      worst: formatAverage(stats.worstAo100),
      currentRecord: stats.currentAo100Record,
      bestRecord: stats.bestAo100Record,
      worstRecord: stats.worstAo100Record,
    },
  ];

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-6 py-2 select-none">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border-1.5 border-sumi/10 dark:border-white/10 rounded-lg p-3 bg-sumi/[0.02] dark:bg-white/[0.02]">
          {statItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-[11px] font-mono uppercase tracking-wider text-sumi/50 dark:text-paper/50">
                {item.label}
              </div>

              {/* 1st row: Current */}
              {item.isAverage && item.currentRecord ? (
                <div
                  onClick={() => openDetail(item.label, "Current", item.currentRecord)}
                  title={`View ${item.label} (Current) details`}
                  className="font-mono font-semibold text-sm sm:text-base text-sumi dark:text-paper mt-0.5 cursor-pointer hover:underline hover:text-vermilion transition-colors"
                >
                  {item.current}
                </div>
              ) : (
                <div className="font-mono font-semibold text-sm sm:text-base text-sumi dark:text-paper mt-0.5">
                  {item.current}
                </div>
              )}

              {/* 2nd row: Best / Worst */}
              {item.isAverage ? (
                <div className="text-[10px] font-mono text-sumi/40 dark:text-paper/40 truncate">
                  {item.best !== "-" && item.bestRecord ? (
                    <span
                      onClick={() => openDetail(item.label, "Best", item.bestRecord)}
                      title={`View ${item.label} (Best) details`}
                      className="cursor-pointer hover:underline hover:text-sumi dark:hover:text-paper transition-colors"
                    >
                      {item.best}
                    </span>
                  ) : (
                    <span>{item.best}</span>
                  )}
                  <span> / </span>
                  {item.worst !== "-" && item.worstRecord ? (
                    <span
                      onClick={() => openDetail(item.label, "Worst", item.worstRecord)}
                      title={`View ${item.label} (Worst) details`}
                      className="cursor-pointer hover:underline hover:text-sumi dark:hover:text-paper transition-colors"
                    >
                      {item.worst}
                    </span>
                  ) : (
                    <span>{item.worst}</span>
                  )}
                </div>
              ) : (
                <div className="text-[10px] font-mono text-sumi/40 dark:text-paper/40 truncate">
                  {item.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AverageDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetail}
        label={detailModal.label}
        kind={detailModal.kind}
        record={detailModal.record}
        precision={precision}
      />
    </>
  );
};
