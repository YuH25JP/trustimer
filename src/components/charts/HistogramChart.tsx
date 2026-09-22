import React, { useState, useRef } from "react";
import { HistogramData, HistogramBin } from "../../lib/graphStats";
import { formatTime } from "../../lib/stats";

interface HistogramChartProps {
  histogram: HistogramData;
  precision?: 2 | 3;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  histogram,
  precision = 3,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBin, setHoveredBin] = useState<HistogramBin | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const { bins, totalValidCount, meanMs, medianMs, minMs, maxMs } = histogram;

  const width = 600;
  const height = 300;
  const pad = { top: 38, right: 25, bottom: 30, left: 45 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  // Y-axis ticks for count (e.g. 0, max/2, max)
  const yTicks = [
    0,
    Math.ceil(maxCount / 2),
    maxCount,
  ];

  const handleBarMouseMove = (
    e: React.MouseEvent<SVGRectElement>,
    bin: HistogramBin
  ) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHoveredBin(bin);
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredBin(null);
    setMousePos(null);
  };

  // Convert time to X coordinate in plot area
  const getTimeX = (timeMs: number) => {
    if (!minMs || !maxMs || minMs === maxMs) return pad.left + plotW / 2;
    const clamped = Math.max(minMs, Math.min(maxMs, timeMs));
    return pad.left + ((clamped - minMs) / (maxMs - minMs)) * plotW;
  };

  if (totalValidCount === 0 || bins.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-sumi/40 dark:text-paper/40">
        No valid times to display distribution.
      </div>
    );
  }

  const barWidth = plotW / bins.length;

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis grid lines and labels */}
        {yTicks.map((count, idx) => {
          const y = pad.top + plotH - (count / maxCount) * plotH;
          return (
            <g key={`ytick-${count}-${idx}`}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="currentColor"
                className="text-sumi/10 dark:text-paper/10"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={pad.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-sumi/50 dark:fill-paper/50 text-[11px] font-mono"
              >
                {count}
              </text>
            </g>
          );
        })}

        {/* X-axis line */}
        <line
          x1={pad.left}
          y1={height - pad.bottom}
          x2={width - pad.right}
          y2={height - pad.bottom}
          stroke="currentColor"
          className="text-sumi/20 dark:text-paper/20"
          strokeWidth="1"
        />

        {/* Histogram Bars */}
        {bins.map((bin, i) => {
          const barH = (bin.count / maxCount) * plotH;
          const x = pad.left + i * barWidth;
          const y = pad.top + plotH - barH;
          const isHovered = hoveredBin?.label === bin.label;

          return (
            <g key={`bar-${bin.label}-${i}`}>
              <rect
                x={x + 2}
                y={y}
                width={Math.max(1, barWidth - 4)}
                height={barH}
                fill={bin.isPeak ? "#d64045" : "currentColor"}
                className={`transition-opacity cursor-pointer ${
                  bin.isPeak
                    ? isHovered
                      ? "opacity-100"
                      : "opacity-80"
                    : isHovered
                    ? "opacity-60 text-sumi dark:text-paper"
                    : "opacity-25 text-sumi dark:text-paper"
                }`}
                onMouseMove={(e) => handleBarMouseMove(e, bin)}
              />

              {/* Count label on top of bar if space permits */}
              {bin.count > 0 && barH > 14 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className={`text-[11px] font-mono ${
                    bin.isPeak
                      ? "fill-vermilion font-bold"
                      : "fill-sumi/60 dark:fill-paper/60"
                  }`}
                >
                  {bin.count}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis labels (first, mid, last bin starts) */}
        {bins.length > 0 && (
          <>
            <text
              x={pad.left}
              y={height - pad.bottom + 17}
              textAnchor="start"
              className="fill-sumi/50 dark:fill-paper/50 text-[11px] font-mono"
            >
              {formatTime(bins[0].rangeStartMs, "NONE", true, 2).text}
            </text>
            {bins.length > 2 && (
              <text
                x={pad.left + plotW / 2}
                y={height - pad.bottom + 17}
                textAnchor="middle"
                className="fill-sumi/50 dark:fill-paper/50 text-[11px] font-mono"
              >
                {formatTime(bins[Math.floor(bins.length / 2)].rangeStartMs, "NONE", true, 2).text}
              </text>
            )}
            <text
              x={width - pad.right}
              y={height - pad.bottom + 17}
              textAnchor="end"
              className="fill-sumi/50 dark:fill-paper/50 text-[11px] font-mono"
            >
              {formatTime(bins[bins.length - 1].rangeEndMs, "NONE", true, 2).text}
            </text>
          </>
        )}

        {/* Mean Vertical Guideline */}
        {meanMs !== null && (
          <g>
            <line
              x1={getTimeX(meanMs)}
              y1={pad.top}
              x2={getTimeX(meanMs)}
              y2={height - pad.bottom}
              stroke="#d64045"
              strokeDasharray="3 3"
              strokeWidth="1.2"
              className="opacity-70"
            />
            <text
              x={getTimeX(meanMs)}
              y={pad.top - 18}
              textAnchor="middle"
              className="fill-vermilion text-[11px] font-mono font-semibold"
            >
              Mean {formatTime(meanMs, "NONE", true, precision).text}
            </text>
          </g>
        )}

        {/* Median Vertical Guideline */}
        {medianMs !== null && (
          <g>
            <line
              x1={getTimeX(medianMs)}
              y1={pad.top}
              x2={getTimeX(medianMs)}
              y2={height - pad.bottom}
              stroke="currentColor"
              className="text-sumi/40 dark:text-paper/40"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          </g>
        )}
      </svg>

      {/* Modern Ink Tooltip */}
      {hoveredBin && mousePos && (
        <div
          className="absolute pointer-events-none z-20 border-1.5 border-sumi/20 dark:border-white/20 bg-paper dark:bg-paper-dark px-3 py-2 rounded font-mono shadow-none"
          style={{
            left: `${Math.min(
              mousePos.x + 12,
              (containerRef.current?.clientWidth || 300) - 180
            )}px`,
            top: `${Math.max(10, mousePos.y - 60)}px`,
          }}
        >
          <div className="text-xs text-sumi/50 dark:text-paper/50 pb-1 border-b border-sumi/10 dark:border-white/10 font-medium">
            {hoveredBin.label}
          </div>
          <div className="pt-1.5 flex items-center justify-between gap-4 text-xs">
            <span className="text-sumi/60 dark:text-paper/60">Count:</span>
            <span className="font-bold text-sm text-sumi dark:text-paper">
              {hoveredBin.count}{" "}
              <span className="text-xs font-normal text-sumi/50 dark:text-paper/50">
                ({hoveredBin.percentage}%)
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
