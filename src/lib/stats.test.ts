import { describe, it, expect } from "vitest";
import { formatTime, calcMo3, calcAo5, calcTrimmedAverage } from "./stats";
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
  it("formats regular times under 1 minute correctly", () => {
    expect(formatTime(9450).text).toBe("9.45");
    expect(formatTime(12340).text).toBe("12.34");
    expect(formatTime(59990).text).toBe("59.99");
  });

  it("formats minutes and hours", () => {
    expect(formatTime(69450).text).toBe("1:09.45");
    expect(formatTime(3669450).text).toBe("1:01:09.45");
  });

  it("handles DNF and +2", () => {
    expect(formatTime(10000, "DNF").text).toBe("DNF");
    expect(formatTime(12000, "PLUS_TWO").text).toBe("12.00+");
  });

  it("hides milliseconds when showMilliseconds is false", () => {
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
