import { describe, it, expect } from "vitest";
import { formatTime, calcMo3, calcAo5, calcTrimmedAverage, calculateSessionStats, getTrimmedSolveIds } from "./stats";
import { Solve } from "../types";

function makeSolve(timeMs: number, penalty: "NONE" | "PLUS_TWO" | "DNF" = "NONE"): Solve {
  return {
    id: crypto.randomUUID(),
    sessionId: "test-session",
    timeMs: penalty === "PLUS_TWO" ? timeMs + 2000 : timeMs,
    rawTimeMs: timeMs,
    penalty,
    scramble: "R U R' U'",
    comment: "",
    createdAt: Date.now(),
  };
}

describe("formatTime", () => {
  it("formats regular times with 3 decimal digits by default", () => {
    expect(formatTime(9450).text).toBe("9.450");
    expect(formatTime(12345).text).toBe("12.345");
    expect(formatTime(59990).text).toBe("59.990");
  });

  it("formats regular times with 2 decimal digits when precision=2", () => {
    expect(formatTime(9450, "NONE", true, 2).text).toBe("9.45");
    expect(formatTime(12345, "NONE", true, 2).text).toBe("12.34");
    expect(formatTime(59990, "NONE", true, 2).text).toBe("59.99");
  });

  it("formats minutes and hours", () => {
    expect(formatTime(69450).text).toBe("1:09.450");
    expect(formatTime(3669450).text).toBe("1:01:09.450");
    expect(formatTime(69450, "NONE", true, 2).text).toBe("1:09.45");
  });

  it("handles DNF and +2", () => {
    expect(formatTime(10000, "DNF").text).toBe("DNF");
    expect(formatTime(12000, "PLUS_TWO").text).toBe("12.000+");
    expect(formatTime(12000, "PLUS_TWO", true, 2).text).toBe("12.00+");
  });

  it("hides fractions when showMilliseconds is false", () => {
    expect(formatTime(12340, "NONE", false).text).toBe("12");
    expect(formatTime(69450, "NONE", false).text).toBe("1:09");
  });
});

describe("calcMo3", () => {
  it("returns null if less than 3 solves", () => {
    expect(calcMo3([makeSolve(10000), makeSolve(12000)])).toBeNull();
  });

  it("calculates arithmetic mean of 3 solves", () => {
    const solves = [makeSolve(10000), makeSolve(11000), makeSolve(12000)];
    expect(calcMo3(solves)).toBe(11000);
  });

  it("returns -1 (DNF) if any solve is DNF", () => {
    const solves = [makeSolve(10000), makeSolve(11000, "DNF"), makeSolve(12000)];
    expect(calcMo3(solves)).toBe(-1);
  });
});

describe("calcAo5", () => {
  it("returns null if less than 5 solves", () => {
    expect(calcAo5([makeSolve(10000), makeSolve(11000)])).toBeNull();
  });

  it("trims best and worst and averages the middle 3", () => {
    // 8.0, 9.0, 10.0, 11.0, 12.0 -> trims 8.0 and 12.0 -> avg(9, 10, 11) = 10.0
    const solves = [
      makeSolve(8000),
      makeSolve(9000),
      makeSolve(10000),
      makeSolve(11000),
      makeSolve(12000),
    ];
    expect(calcAo5(solves)).toBe(10000);
  });

  it("handles 1 DNF by trimming DNF as worst and fastest as best", () => {
    // 9.0, 10.0, 11.0, 12.0, DNF -> trims 9.0 (best) and DNF (worst) -> avg(10, 11, 12) = 11.0
    const solves = [
      makeSolve(9000),
      makeSolve(10000),
      makeSolve(11000),
      makeSolve(12000),
      makeSolve(15000, "DNF"),
    ];
    expect(calcAo5(solves)).toBe(11000);
  });

  it("returns -1 (DNF) if 2 or more solves are DNF", () => {
    const solves = [
      makeSolve(9000),
      makeSolve(10000),
      makeSolve(11000),
      makeSolve(12000, "DNF"),
      makeSolve(15000, "DNF"),
    ];
    expect(calcAo5(solves)).toBe(-1);
  });
});

describe("calcTrimmedAverage (ao12)", () => {
  it("trims 1 best and 1 worst for 12 solves", () => {
    const times = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((s) => s * 1000);
    const solves = times.map((t) => makeSolve(t));
    // trims 10s and 21s -> sum of 11..20 = 155 -> avg = 15.5s (15500)
    expect(calcTrimmedAverage(solves, 12)).toBe(15500);
  });
});

describe("calculateSessionStats", () => {
  it("returns all nulls/zeros when empty", () => {
    const stats = calculateSessionStats([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.currentSingle).toBeNull();
    expect(stats.bestSingle).toBeNull();
    expect(stats.worstSingle).toBeNull();
    expect(stats.currentAo5).toBeNull();
    expect(stats.currentAo5Record).toBeNull();
    expect(stats.bestAo5Record).toBeNull();
  });

  it("correctly identifies current, best, and worst single and ao5, including solve records", () => {
    // Solves are stored newest first (solves[0] is latest)
    const s1 = makeSolve(14000);
    const s2 = makeSolve(11000);
    const s3 = makeSolve(12000);
    const s4 = makeSolve(9000);
    const s5 = makeSolve(13000);
    const s6 = makeSolve(15000);
    const solves = [s1, s2, s3, s4, s5, s6];

    const stats = calculateSessionStats(solves);
    expect(stats.totalCount).toBe(6);
    expect(stats.currentSingle?.timeMs).toBe(14000);
    expect(stats.bestSingle?.timeMs).toBe(9000);
    expect(stats.worstSingle?.timeMs).toBe(15000);
    expect(stats.currentAo5).toBeDefined();
    expect(stats.bestAo5).toBeDefined();
    expect(stats.worstAo5).toBeDefined();
    expect(stats.bestAo5).toBeLessThanOrEqual(stats.worstAo5!);

    // Records verification
    expect(stats.currentAo5Record).not.toBeNull();
    expect(stats.currentAo5Record?.solves.length).toBe(5);
    expect(stats.currentAo5Record?.value).toBe(stats.currentAo5);

    expect(stats.bestAo5Record).not.toBeNull();
    expect(stats.bestAo5Record?.solves.length).toBe(5);
    expect(stats.bestAo5Record?.value).toBe(stats.bestAo5);

    expect(stats.worstAo5Record).not.toBeNull();
    expect(stats.worstAo5Record?.solves.length).toBe(5);
    expect(stats.worstAo5Record?.value).toBe(stats.worstAo5);

    expect(stats.currentMo3Record?.solves.length).toBe(3);
    expect(stats.bestMo3Record?.solves.length).toBe(3);
  });
});

describe("getTrimmedSolveIds", () => {
  it("returns empty set for mo3 (count <= 3)", () => {
    const s = [makeSolve(10000), makeSolve(11000), makeSolve(12000)];
    expect(getTrimmedSolveIds(s, 3).size).toBe(0);
  });

  it("identifies fastest and slowest solves in regular ao5", () => {
    const s1 = makeSolve(9000); // fastest
    const s2 = makeSolve(10000);
    const s3 = makeSolve(11000);
    const s4 = makeSolve(12000);
    const s5 = makeSolve(13000); // slowest
    const solves = [s1, s2, s3, s4, s5];

    const trimmed = getTrimmedSolveIds(solves, 5);
    expect(trimmed.has(s1.id)).toBe(true);
    expect(trimmed.has(s5.id)).toBe(true);
    expect(trimmed.has(s2.id)).toBe(false);
    expect(trimmed.has(s3.id)).toBe(false);
    expect(trimmed.has(s4.id)).toBe(false);
  });

  it("identifies DNF as slowest and trims fastest in ao5 with 1 DNF", () => {
    const s1 = makeSolve(9000); // fastest
    const s2 = makeSolve(10000);
    const s3 = makeSolve(11000);
    const s4 = makeSolve(12000);
    const sDnf = makeSolve(15000, "DNF"); // DNF
    const solves = [s1, s2, s3, s4, sDnf];

    const trimmed = getTrimmedSolveIds(solves, 5);
    expect(trimmed.has(s1.id)).toBe(true);
    expect(trimmed.has(sDnf.id)).toBe(true);
    expect(trimmed.has(s2.id)).toBe(false);
  });
});
