import { describe, it, expect } from "vitest";
import { calculateTimeSeries, calculateHistogram } from "./graphStats";
import { Solve } from "../types";

function mockSolve(
  id: string,
  timeMs: number,
  penalty: "NONE" | "PLUS_TWO" | "DNF" = "NONE",
  createdAt = Date.now()
): Solve {
  return {
    id,
    sessionId: "test-session",
    timeMs: penalty === "PLUS_TWO" ? timeMs + 2000 : timeMs,
    rawTimeMs: timeMs,
    penalty,
    scramble: "R U R' U'",
    comment: "",
    createdAt,
  };
}

describe("calculateTimeSeries", () => {
  it("returns empty array for empty solves", () => {
    expect(calculateTimeSeries([])).toEqual([]);
  });

  it("calculates chronological order with proper indices", () => {
    // Solves are descending (newest first)
    const solves = [
      mockSolve("s3", 12000, "NONE", 300),
      mockSolve("s2", 11000, "NONE", 200),
      mockSolve("s1", 10000, "NONE", 100),
    ];

    const result = calculateTimeSeries(solves);
    expect(result).toHaveLength(3);
    // Chronological: s1, s2, s3
    expect(result[0].solveId).toBe("s1");
    expect(result[0].index).toBe(1);
    expect(result[0].timeMs).toBe(10000);
    expect(result[0].ao5).toBeNull();

    expect(result[1].solveId).toBe("s2");
    expect(result[1].index).toBe(2);

    expect(result[2].solveId).toBe("s3");
    expect(result[2].index).toBe(3);
  });

  it("calculates ao5 starting at the 5th solve", () => {
    // 5 solves: 10s, 11s, 12s, 13s, 14s (chronological: 10, 11, 12, 13, 14)
    // trimmed: remove 10s and 14s, average of 11, 12, 13 = 12s (12000)
    const rawTimes = [10000, 11000, 12000, 13000, 14000];
    const solves = rawTimes.map((t, idx) => mockSolve(`s${idx}`, t)).reverse();

    const result = calculateTimeSeries(solves);
    expect(result[0].ao5).toBeNull();
    expect(result[3].ao5).toBeNull();
    expect(result[4].ao5).toBe(12000);
  });

  it("tracks bestSingleSoFar correctly", () => {
    // Chronological: 15s, 12s, 14s, DNF, 10s
    const solves = [
      mockSolve("s5", 10000),
      mockSolve("s4", 8000, "DNF"),
      mockSolve("s3", 14000),
      mockSolve("s2", 12000),
      mockSolve("s1", 15000),
    ];

    const result = calculateTimeSeries(solves);
    expect(result[0].bestSingleSoFar).toBe(15000);
    expect(result[1].bestSingleSoFar).toBe(12000);
    expect(result[2].bestSingleSoFar).toBe(12000);
    expect(result[3].bestSingleSoFar).toBe(12000); // DNF ignored
    expect(result[4].bestSingleSoFar).toBe(10000); // 10s is new best
  });
});

describe("calculateHistogram", () => {
  it("handles empty or all-DNF solves", () => {
    expect(calculateHistogram([]).totalValidCount).toBe(0);
    expect(calculateHistogram([mockSolve("s1", 10000, "DNF")]).totalValidCount).toBe(0);
  });

  it("calculates bins, mean, and median accurately", () => {
    const solves = [
      mockSolve("s1", 10000),
      mockSolve("s2", 10500),
      mockSolve("s3", 11000),
      mockSolve("s4", 11500),
      mockSolve("s5", 12000),
    ];

    const result = calculateHistogram(solves, 5);
    expect(result.totalValidCount).toBe(5);
    expect(result.minMs).toBe(10000);
    expect(result.maxMs).toBe(12000);
    expect(result.meanMs).toBe(11000);
    expect(result.medianMs).toBe(11000);
    expect(result.bins.length).toBeGreaterThan(0);

    const totalInBins = result.bins.reduce((acc, b) => acc + b.count, 0);
    expect(totalInBins).toBe(5);
    expect(result.bins.some((b) => b.isPeak)).toBe(true);
  });
});
