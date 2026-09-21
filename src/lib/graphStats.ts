import { Solve, Penalty } from "../types";
import { calcAo5, calcTrimmedAverage, formatTime } from "./stats";

export interface TimeSeriesPoint {
  index: number; // 1-based solve index (#1, #2, ...)
  solveId: string;
  timeMs: number;
  penalty: Penalty;
  isDnf: boolean;
  isPlusTwo: boolean;
  rawTimeMs: number;
  ao5: number | null; // ms, or -1 for DNF, or null
  ao12: number | null; // ms, or -1 for DNF, or null
  bestSingleSoFar: number | null; // best valid timeMs up to this solve
  createdAt: number;
  scramble: string;
}

/**
 * Calculates chronological time series points for line chart.
 * Input `solves` is expected to be in standard descending order (newest first).
 */
export function calculateTimeSeries(solves: Solve[]): TimeSeriesPoint[] {
  if (solves.length === 0) return [];

  // Convert to chronological order (oldest first)
  const chronological = [...solves].reverse();
  const points: TimeSeriesPoint[] = [];

  let currentBest: number | null = null;

  for (let i = 0; i < chronological.length; i++) {
    const solve = chronological[i];
    const isDnf = solve.penalty === "DNF";
    const isPlusTwo = solve.penalty === "PLUS_TWO";

    if (!isDnf) {
      if (currentBest === null || solve.timeMs < currentBest) {
        currentBest = solve.timeMs;
      }
    }

    // ao5: needs at least 5 solves up to index i
    let ao5: number | null = null;
    if (i >= 4) {
      // calcAo5 expects newest solve at index 0, so reverse the window
      const window5 = chronological.slice(i - 4, i + 1).reverse();
      ao5 = calcAo5(window5);
    }

    // ao12: needs at least 12 solves up to index i
    let ao12: number | null = null;
    if (i >= 11) {
      const window12 = chronological.slice(i - 11, i + 1).reverse();
      ao12 = calcTrimmedAverage(window12, 12);
    }

    points.push({
      index: i + 1,
      solveId: solve.id,
      timeMs: solve.timeMs,
      penalty: solve.penalty,
      isDnf,
      isPlusTwo,
      rawTimeMs: solve.rawTimeMs,
      ao5,
      ao12,
      bestSingleSoFar: currentBest,
      createdAt: solve.createdAt,
      scramble: solve.scramble,
    });
  }

  return points;
}

export interface HistogramBin {
  rangeStartMs: number;
  rangeEndMs: number;
  count: number;
  percentage: number;
  label: string;
  isPeak: boolean;
}

export interface HistogramData {
  bins: HistogramBin[];
  totalValidCount: number;
  meanMs: number | null;
  medianMs: number | null;
  minMs: number | null;
  maxMs: number | null;
}

/**
 * Calculates histogram bins and distribution statistics.
 * Excludes DNF solves from distribution.
 */
export function calculateHistogram(
  solves: Solve[],
  targetBinCount = 10,
  precision: 2 | 3 = 3
): HistogramData {
  const validSolves = solves.filter((s) => s.penalty !== "DNF");
  const totalValidCount = validSolves.length;

  if (totalValidCount === 0) {
    return {
      bins: [],
      totalValidCount: 0,
      meanMs: null,
      medianMs: null,
      minMs: null,
      maxMs: null,
    };
  }

  const times = validSolves.map((s) => s.timeMs).sort((a, b) => a - b);
  const minMs = times[0];
  const maxMs = times[times.length - 1];

  // Mean
  const sum = times.reduce((acc, t) => acc + t, 0);
  const meanMs = Math.round(sum / totalValidCount);

  // Median
  const mid = Math.floor(times.length / 2);
  const medianMs =
    times.length % 2 !== 0
      ? times[mid]
      : Math.round((times[mid - 1] + times[mid]) / 2);

  // If all times are equal or only 1 solve, single bin
  if (minMs === maxMs) {
    return {
      bins: [
        {
          rangeStartMs: minMs,
          rangeEndMs: maxMs,
          count: totalValidCount,
          percentage: 100,
          label: formatTime(minMs, "NONE", true, precision).text,
          isPeak: true,
        },
      ],
      totalValidCount,
      meanMs,
      medianMs,
      minMs,
      maxMs,
    };
  }

  // Calculate a clean bin size (e.g. 500ms, 1000ms, 2000ms or computed)
  const rawBinSize = (maxMs - minMs) / targetBinCount;
  // Nice step intervals in ms: [100, 250, 500, 1000, 2000, 5000, 10000, ...]
  const candidateSteps = [100, 200, 500, 1000, 2000, 5000, 10000, 15000, 30000];
  let binStep = candidateSteps[candidateSteps.length - 1];
  for (const step of candidateSteps) {
    if (step >= rawBinSize) {
      binStep = step;
      break;
    }
  }

  // Align start to binStep boundary
  const startBound = Math.floor(minMs / binStep) * binStep;
  const endBound = Math.ceil((maxMs + 1) / binStep) * binStep;
  const numBins = Math.max(1, Math.round((endBound - startBound) / binStep));

  const bins: HistogramBin[] = [];
  for (let b = 0; b < numBins; b++) {
    const bStart = startBound + b * binStep;
    const bEnd = bStart + binStep;
    const count = times.filter((t) => t >= bStart && t < bEnd).length;
    const percentage = totalValidCount > 0 ? (count / totalValidCount) * 100 : 0;

    const startFormatted = formatTime(bStart, "NONE", true, 2).text;
    const endFormatted = formatTime(bEnd, "NONE", true, 2).text;

    bins.push({
      rangeStartMs: bStart,
      rangeEndMs: bEnd,
      count,
      percentage: Math.round(percentage * 10) / 10,
      label: `${startFormatted} - ${endFormatted}`,
      isPeak: false,
    });
  }

  // Identify peak bin(s)
  const maxCount = Math.max(...bins.map((b) => b.count), 0);
  if (maxCount > 0) {
    bins.forEach((b) => {
      if (b.count === maxCount) b.isPeak = true;
    });
  }

  return {
    bins,
    totalValidCount,
    meanMs,
    medianMs,
    minMs,
    maxMs,
  };
}
