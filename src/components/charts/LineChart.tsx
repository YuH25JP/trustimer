import React, { useState, useRef, useMemo, useCallback } from "react";
import { TimeSeriesPoint } from "../../lib/graphStats";
import { formatTime } from "../../lib/stats";
import { formatDateShort } from "../../lib/dateUtils";

interface LineChartProps {
  points: TimeSeriesPoint[];
  showAo5: boolean;
  showAo12: boolean;
  precision?: 2 | 3;
}

export const LineChart: React.FC<LineChartProps> = ({
  points,
  showAo5,
  showAo12,
  precision = 3,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Chart dimensions in virtual viewBox coordinates
  const width = 600;
  const height = 300;
  const pad = { top: 20, right: 25, bottom: 28, left: 55 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Compute min/max Y across all visible series
  const { minY, maxY, yTicks, bestSingle } = useMemo(() => {
    const validTimes: number[] = [];
    let best = Infinity;

    for (const p of points) {
      if (!p.isDnf) {
        validTimes.push(p.timeMs);
        if (p.timeMs < best) best = p.timeMs;
      }
      if (showAo5 && p.ao5 !== null && p.ao5 !== -1) {
        validTimes.push(p.ao5);
      }
      if (showAo12 && p.ao12 !== null && p.ao12 !== -1) {
        validTimes.push(p.ao12);
      }
    }

    if (validTimes.length === 0) {
      return { minY: 0, maxY: 10000, yTicks: [], bestSingle: null };
    }

    let min = Math.min(...validTimes);
    let max = Math.max(...validTimes);

    if (min === max) {
      min = Math.max(0, min - 2000);
      max = max + 2000;
    } else {
      const margin = (max - min) * 0.12;
      min = Math.max(0, min - margin);
      max = max + margin;
    }

    // 4 Y-axis grid ticks
    const tickCount = 4;
    const ticks: number[] = [];
    const step = (max - min) / (tickCount - 1);
    for (let i = 0; i < tickCount; i++) {
      ticks.push(Math.round(min + i * step));
    }

    return {
      minY: min,
      maxY: max,
      yTicks: ticks,
      bestSingle: best === Infinity ? null : best,
    };
  }, [points, showAo5, showAo12]);

  // Coordinate conversion helpers
  const getX = useCallback(
    (index: number, total: number) => {
      if (total <= 1) return pad.left + plotW / 2;
      return pad.left + (index / (total - 1)) * plotW;
    },
    [pad.left, plotW]
  );

  const getY = useCallback(
    (val: number) => {
      if (maxY === minY) return pad.top + plotH / 2;
      return pad.top + plotH - ((val - minY) / (maxY - minY)) * plotH;
    },
    [maxY, minY, pad.top, plotH]
  );

  // SVG paths generation
  const { singlePath, ao5Path, ao12Path, dnfPoints, xCoords } = useMemo(() => {
    const total = points.length;
    if (total === 0) {
      return { singlePath: "", ao5Path: "", ao12Path: "", dnfPoints: [], xCoords: [] };
    }

    const coords: number[] = [];
    const dnfs: { x: number; y: number; index: number }[] = [];

    let singleSegments: string[] = [];
    let currentSingleSeq: string[] = [];

    let ao5Segments: string[] = [];
    let currentAo5Seq: string[] = [];

    let ao12Segments: string[] = [];
    let currentAo12Seq: string[] = [];

    points.forEach((p, i) => {
      const x = getX(i, total);
      coords.push(x);

      // Single line
      if (p.isDnf) {
        if (currentSingleSeq.length > 0) {
          singleSegments.push(currentSingleSeq.join(" "));
          currentSingleSeq = [];
        }
        dnfs.push({ x, y: pad.top + 4, index: p.index });
      } else {
        const y = getY(p.timeMs);
        if (currentSingleSeq.length === 0) {
          currentSingleSeq.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
        } else {
          currentSingleSeq.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
      }

      // ao5 line
      if (showAo5) {
        if (p.ao5 !== null && p.ao5 !== -1) {
          const y = getY(p.ao5);
          if (currentAo5Seq.length === 0) {
            currentAo5Seq.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
          } else {
            currentAo5Seq.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
        } else {
          if (currentAo5Seq.length > 0) {
            ao5Segments.push(currentAo5Seq.join(" "));
            currentAo5Seq = [];
          }
        }
      }

      // ao12 line
      if (showAo12) {
        if (p.ao12 !== null && p.ao12 !== -1) {
          const y = getY(p.ao12);
          if (currentAo12Seq.length === 0) {
            currentAo12Seq.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
          } else {
            currentAo12Seq.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
        } else {
          if (currentAo12Seq.length > 0) {
            ao12Segments.push(currentAo12Seq.join(" "));
            currentAo12Seq = [];
          }
        }
      }
    });

    if (currentSingleSeq.length > 0) singleSegments.push(currentSingleSeq.join(" "));
    if (currentAo5Seq.length > 0) ao5Segments.push(currentAo5Seq.join(" "));
    if (currentAo12Seq.length > 0) ao12Segments.push(currentAo12Seq.join(" "));

    return {
      singlePath: singleSegments.join(" "),
      ao5Path: ao5Segments.join(" "),
      ao12Path: ao12Segments.join(" "),
      dnfPoints: dnfs,
      xCoords: coords,
    };
  }, [points, getX, getY, pad.top, showAo5, showAo12]);

  // Handle fast binary search for nearest hover point
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (points.length === 0 || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Scale clientX to SVG coordinate space
      const svgX = (clientX / rect.width) * width;

      // Binary search closest point in xCoords
      let low = 0;
      let high = xCoords.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (xCoords[mid] < svgX) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      let closest = low;
      if (low > 0 && low < xCoords.length) {
        const diff1 = Math.abs(xCoords[low - 1] - svgX);
        const diff2 = Math.abs(xCoords[low] - svgX);
        closest = diff1 < diff2 ? low - 1 : low;
      } else if (low >= xCoords.length) {
        closest = xCoords.length - 1;
      }

      setHoverIndex(closest);
      setMousePos({ x: clientX, y: clientY });
    },
    [points.length, width, xCoords]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
    setMousePos(null);
  }, []);

  const activePoint = hoverIndex !== null && hoverIndex < points.length ? points[hoverIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full h-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis horizontal grid lines */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
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
                {formatTime(tick, "NONE", true, 2).text}
              </text>
            </g>
          );
        })}

        {/* PB reference line */}
        {bestSingle !== null && (
          <g>
            <line
              x1={pad.left}
              y1={getY(bestSingle)}
              x2={width - pad.right}
              y2={getY(bestSingle)}
              stroke="#d64045"
              strokeDasharray="5 3"
              strokeWidth="1.5"
              className="opacity-80"
            />
            <text
              x={width - pad.right}
              y={getY(bestSingle) - 5}
              textAnchor="end"
              className="fill-vermilion text-[11px] font-mono font-semibold"
            >
              PB {formatTime(bestSingle, "NONE", true, precision).text}
            </text>
          </g>
        )}

        {/* X-axis boundary */}
        <line
          x1={pad.left}
          y1={height - pad.bottom}
          x2={width - pad.right}
          y2={height - pad.bottom}
          stroke="currentColor"
          className="text-sumi/20 dark:text-paper/20"
          strokeWidth="1"
        />

        {/* X-axis labels (first, mid, last solve indices) */}
        {points.length > 0 && (
          <>
            <text
              x={getX(0, points.length)}
              y={height - pad.bottom + 17}
              textAnchor="start"
              className="fill-sumi/50 dark:fill-paper/50 text-[11px] font-mono"
            >
              #{points[0].index}
            </text>
            {points.length > 2 && (
              <text
                x={getX(Math.floor(points.length / 2), points.length)}
                y={height - pad.bottom + 17}
                textAnchor="middle"
                className="fill-sumi/50 dark:fill-paper/50 text-[11px] font-mono"
              >
                #{points[Math.floor(points.length / 2)].index}
              </text>
            )}
            {points.length > 1 && (
              <text
                x={getX(points.length - 1, points.length)}
                y={height - pad.bottom + 17}
                textAnchor="end"
                className="fill-sumi/50 dark:fill-paper/50 text-[11px] font-mono"
              >
                #{points[points.length - 1].index}
              </text>
            )}
          </>
        )}

        {/* Data Paths */}
        {/* Single Line (neutral ink) */}
        {singlePath && (
          <path
            d={singlePath}
            fill="none"
            stroke="currentColor"
            className="text-sumi/40 dark:text-paper/40"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* ao12 Trend Line (slate blue) */}
        {showAo12 && ao12Path && (
          <path
            d={ao12Path}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="opacity-80"
          />
        )}

        {/* ao5 Trend Line (vermilion primary) */}
        {showAo5 && ao5Path && (
          <path
            d={ao5Path}
            fill="none"
            stroke="#d64045"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* DNF Cross Markers at top */}
        {dnfPoints.map((d) => (
          <g key={`dnf-${d.index}`} className="text-vermilion">
            <line
              x1={d.x - 3}
              y1={d.y - 3}
              x2={d.x + 3}
              y2={d.y + 3}
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1={d.x + 3}
              y1={d.y - 3}
              x2={d.x - 3}
              y2={d.y + 3}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </g>
        ))}

        {/* Hover Highlight: Single Vertical Line and Single Dots */}
        {activePoint && hoverIndex !== null && (
          <g>
            <line
              x1={xCoords[hoverIndex]}
              y1={pad.top}
              x2={xCoords[hoverIndex]}
              y2={height - pad.bottom}
              stroke="currentColor"
              className="text-sumi/30 dark:text-paper/30"
              strokeDasharray="2 2"
              strokeWidth="1"
            />

            {/* Dot on Single point */}
            {!activePoint.isDnf && (
              <circle
                cx={xCoords[hoverIndex]}
                cy={getY(activePoint.timeMs)}
                r="3.5"
                fill="currentColor"
                className="text-sumi dark:text-paper"
              />
            )}

            {/* Dot on ao5 point */}
            {showAo5 && activePoint.ao5 !== null && activePoint.ao5 !== -1 && (
              <circle
                cx={xCoords[hoverIndex]}
                cy={getY(activePoint.ao5)}
                r="4"
                fill="#d64045"
              />
            )}

            {/* Dot on ao12 point */}
            {showAo12 && activePoint.ao12 !== null && activePoint.ao12 !== -1 && (
              <circle
                cx={xCoords[hoverIndex]}
                cy={getY(activePoint.ao12)}
                r="3.5"
                fill="#0ea5e9"
              />
            )}
          </g>
        )}
      </svg>

      {/* Modern Ink-style Tooltip */}
      {activePoint && mousePos && (
        <div
          className="absolute pointer-events-none z-20 border-1.5 border-sumi/20 dark:border-white/20 bg-paper dark:bg-paper-dark px-3 py-2 rounded font-mono shadow-none transition-transform"
          style={{
            left: `${Math.min(
              mousePos.x + 12,
              (containerRef.current?.clientWidth || 300) - 170
            )}px`,
            top: `${Math.max(10, mousePos.y - 70)}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3 text-sumi/50 dark:text-paper/50 text-xs pb-1 border-b border-sumi/10 dark:border-white/10">
            <span className="font-semibold">#{activePoint.index}</span>
            <span>{formatDateShort(activePoint.createdAt)}</span>
          </div>
          <div className="pt-1.5 space-y-1">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-sumi/60 dark:text-paper/60">Time:</span>
              <span
                className={`font-bold text-sm ${
                  activePoint.isDnf
                    ? "text-vermilion"
                    : activePoint.isPlusTwo
                    ? "text-timer-inspect"
                    : "text-sumi dark:text-paper"
                }`}
              >
                {formatTime(activePoint.timeMs, activePoint.penalty, true, precision).text}
              </span>
            </div>
            {showAo5 && activePoint.ao5 !== null && (
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-vermilion font-medium">ao5:</span>
                <span className="font-semibold text-vermilion">
                  {activePoint.ao5 === -1
                    ? "DNF"
                    : formatTime(activePoint.ao5, "NONE", true, precision).text}
                </span>
              </div>
            )}
            {showAo12 && activePoint.ao12 !== null && (
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-[#0ea5e9] font-medium">ao12:</span>
                <span className="font-semibold text-[#0ea5e9]">
                  {activePoint.ao12 === -1
                    ? "DNF"
                    : formatTime(activePoint.ao12, "NONE", true, precision).text}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
