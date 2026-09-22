import { describe, it, expect } from "vitest";
import { formatDateTime, formatDateShort } from "./dateUtils";

describe("dateUtils", () => {
  describe("formatDateTime", () => {
    it("formats timestamp into YYYY/MM/DD hh:mm with 2-digit padding", () => {
      // 2026-03-05 08:07
      const date = new Date(2026, 2, 5, 8, 7);
      expect(formatDateTime(date.getTime())).toBe("2026/03/05 08:07");
    });

    it("formats afternoon/evening times correctly", () => {
      // 2026-12-25 21:45
      const date = new Date(2026, 11, 25, 21, 45);
      expect(formatDateTime(date)).toBe("2026/12/25 21:45");
    });
  });

  describe("formatDateShort", () => {
    it("formats timestamp into YY/MM/DD with 2-digit year and padding", () => {
      // 2026-04-09
      const date = new Date(2026, 3, 9, 12, 0);
      expect(formatDateShort(date.getTime())).toBe("26/04/09");
    });

    it("handles year 2030 correctly", () => {
      const date = new Date(2030, 0, 1, 0, 0);
      expect(formatDateShort(date)).toBe("30/01/01");
    });
  });
});
