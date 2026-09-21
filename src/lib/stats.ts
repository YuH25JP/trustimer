import { Solve, Penalty } from "../types";

export interface FormattedTime {
  text: string;
  isDnf: boolean;
  isPlusTwo: boolean;
}

/**
 * Format milliseconds into human-readable cube time string.
 * Example:
 *   9450 -> "9.45"
 *   69450 -> "1:09.45"
 *   3669450 -> "1:01:09.45"
 */
export function formatTime(
  timeMs: number,
  penalty: Penalty = "NONE",
  showMilliseconds = true,
  precision: 2 | 3 = 3
): FormattedTime {
  if (penalty === "DNF") {
    return { text: "DNF", isDnf: true, isPlusTwo: false };
  }

  const isPlusTwo = penalty === "PLUS_TWO";
  const totalMs = timeMs;

  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const sStr = seconds.toString().padStart(minutes > 0 || hours > 0 ? 2 : 1, "0");

  let result = "";
  if (hours > 0) {
    const mStr = minutes.toString().padStart(2, "0");
    result = `${hours}:${mStr}:${sStr}`;
  } else if (minutes > 0) {
    result = `${minutes}:${sStr}`;
  } else {
    result = sStr;
  }

  if (showMilliseconds) {
    if (precision === 2) {
      const centiseconds = Math.floor((totalMs % 1000) / 10);
      result = `${result}.${centiseconds.toString().padStart(2, "0")}`;
    } else {
      const milliseconds = Math.floor(totalMs % 1000);
      result = `${result}.${milliseconds.toString().padStart(3, "0")}`;
    }
  }

  if (isPlusTwo) {
    result = `${result}+`;
  }

  return { text: result, isDnf: false, isPlusTwo };
}

/**
 * WCA Mean of 3 (mo3)
 * Returns null if any solve is DNF, or if less than 3 solves.
 */
export function calcMo3(solves: Solve[]): number | null {
  if (solves.length < 3) return null;
  const last3 = solves.slice(0, 3);
  if (last3.some((s) => s.penalty === "DNF")) {
    return -1; // -1 represents DNF average
  }
  const sum = last3.reduce((acc, s) => acc + s.timeMs, 0);
  return Math.round(sum / 3);
}

/**
 * WCA Average of 5 (ao5)
 * Trims the best and worst solve.
 * If 1 solve is DNF, it is treated as worst and trimmed.
 * If 2 or more solves are DNF, average is DNF (-1).
 * Returns null if less than 5 solves.
 */
export function calcAo5(solves: Solve[]): number | null {
  if (solves.length < 5) return null;
  const last5 = solves.slice(0, 5);

  const dnfCount = last5.filter((s) => s.penalty === "DNF").length;
  if (dnfCount >= 2) {
    return -1; // DNF
  }

  const validTimes = last5
    .filter((s) => s.penalty !== "DNF")
    .map((s) => s.timeMs)
    .sort((a, b) => a - b);

  if (dnfCount === 1) {
    // 1 DNF is trimmed as the worst. We trim the fastest among valid.
    // That leaves validTimes[1, 2, 3].
    const trimmed = validTimes.slice(1);
    const sum = trimmed.reduce((a, b) => a + b, 0);
    return Math.round(sum / 3);
  }

  // 0 DNF: remove fastest (index 0) and slowest (index 4)
  const trimmed = validTimes.slice(1, 4);
  const sum = trimmed.reduce((a, b) => a + b, 0);
  return Math.round(sum / 3);
}

/**
 * WCA Trimmed Average (e.g. ao12, ao50, ao100)
 * Trims round(count * trimRatio) best and worst solves.
 * Standard WCA trim ratio is 5% (0.05).
 * e.g. for ao12: 1 best, 1 worst removed -> 10 counted.
 * e.g. for ao100: 5 best, 5 worst removed -> 90 counted.
 */
export function calcTrimmedAverage(
  solves: Solve[],
  count: number,
  trimRatio = 0.05
): number | null {
  if (solves.length < count) return null;
  const subset = solves.slice(0, count);

  const trimCount = Math.max(1, Math.ceil(count * trimRatio));
  const dnfCount = subset.filter((s) => s.penalty === "DNF").length;

  if (dnfCount > trimCount) {
    return -1; // DNF
  }

  const validTimes = subset
    .filter((s) => s.penalty !== "DNF")
    .map((s) => s.timeMs)
    .sort((a, b) => a - b);

  // DNFs consume worst trim slots
  const remainingWorstToTrim = trimCount - dnfCount;
  // Trim `trimCount` best times and `remainingWorstToTrim` worst times from validTimes
  const trimmed = validTimes.slice(
    trimCount,
    validTimes.length - remainingWorstToTrim
  );

  const sum = trimmed.reduce((a, b) => a + b, 0);
  return Math.round(sum / trimmed.length);
}

export interface SessionStats {
  totalCount: number;
  currentSingle: Solve | null;
  bestSingle: Solve | null;
  worstSingle: Solve | null;
  currentMo3: number | null;
  bestMo3: number | null;
  worstMo3: number | null;
  currentAo5: number | null;
  bestAo5: number | null;
  worstAo5: number | null;
  currentAo12: number | null;
  bestAo12: number | null;
  worstAo12: number | null;
  currentAo100: number | null;
  bestAo100: number | null;
  worstAo100: number | null;
}

export function calculateSessionStats(solves: Solve[]): SessionStats {
  const totalCount = solves.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      currentSingle: null,
      bestSingle: null,
      worstSingle: null,
      currentMo3: null,
      bestMo3: null,
      worstMo3: null,
      currentAo5: null,
      bestAo5: null,
      worstAo5: null,
      currentAo12: null,
      bestAo12: null,
      worstAo12: null,
      currentAo100: null,
      bestAo100: null,
      worstAo100: null,
    };
  }

  const currentSingle = solves.length > 0 ? solves[0] : null;

  // Non-DNF solves for best/worst
  const nonDnfSolves = solves.filter((s) => s.penalty !== "DNF");
  let bestSingle: Solve | null = null;
  let worstSingle: Solve | null = null;

  if (nonDnfSolves.length > 0) {
    bestSingle = nonDnfSolves.reduce((min, curr) =>
      curr.timeMs < min.timeMs ? curr : min
    );
    worstSingle = nonDnfSolves.reduce((max, curr) =>
      curr.timeMs > max.timeMs ? curr : max
    );
  }

  const currentMo3 = calcMo3(solves);
  const currentAo5 = calcAo5(solves);
  const currentAo12 = calcTrimmedAverage(solves, 12);
  const currentAo100 = calcTrimmedAverage(solves, 100);

  // Calculate best and worst averages by sliding window
  let bestMo3: number | null = null;
  let worstMo3: number | null = null;
  for (let i = 0; i <= solves.length - 3; i++) {
    const val = calcMo3(solves.slice(i, i + 3));
    if (val !== null && val > 0) {
      if (bestMo3 === null || val < bestMo3) bestMo3 = val;
      if (worstMo3 === null || val > worstMo3) worstMo3 = val;
    }
  }

  let bestAo5: number | null = null;
  let worstAo5: number | null = null;
  for (let i = 0; i <= solves.length - 5; i++) {
    const val = calcAo5(solves.slice(i, i + 5));
    if (val !== null && val > 0) {
      if (bestAo5 === null || val < bestAo5) bestAo5 = val;
      if (worstAo5 === null || val > worstAo5) worstAo5 = val;
    }
  }

  let bestAo12: number | null = null;
  let worstAo12: number | null = null;
  for (let i = 0; i <= solves.length - 12; i++) {
    const val = calcTrimmedAverage(solves.slice(i, i + 12), 12);
    if (val !== null && val > 0) {
      if (bestAo12 === null || val < bestAo12) bestAo12 = val;
      if (worstAo12 === null || val > worstAo12) worstAo12 = val;
    }
  }

  let bestAo100: number | null = null;
  let worstAo100: number | null = null;
  for (let i = 0; i <= solves.length - 100; i++) {
    const val = calcTrimmedAverage(solves.slice(i, i + 100), 100);
    if (val !== null && val > 0) {
      if (bestAo100 === null || val < bestAo100) bestAo100 = val;
      if (worstAo100 === null || val > worstAo100) worstAo100 = val;
    }
  }

  return {
    totalCount,
    currentSingle,
    bestSingle,
    worstSingle,
    currentMo3,
    bestMo3,
    worstMo3,
    currentAo5,
    bestAo5,
    worstAo5,
    currentAo12,
    bestAo12,
    worstAo12,
    currentAo100,
    bestAo100,
    worstAo100,
  };
}
