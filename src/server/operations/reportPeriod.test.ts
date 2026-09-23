import { describe, expect, it } from "vitest";
import { previousIstDayRange } from "./reportPeriod";

describe("previousIstDayRange", () => {
  it("returns the real previous IST day when called during early UTC morning (still the same IST calendar day)", () => {
    // Hand-verified independently in Python: 06:14 UTC = 11:44 IST,
    // still Sep 23 in IST.
    const now = new Date("2026-09-23T06:14:00.000Z");
    const { start, end } = previousIstDayRange(now);
    expect(start.toISOString()).toBe("2026-09-21T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-09-22T18:30:00.000Z");
  });

  it("correctly rolls over to the next IST day when UTC time is late evening - the exact case a naive UTC-day computation would get wrong", () => {
    // Hand-verified independently in Python: 20:00 UTC = 01:30 IST the
    // *next* calendar day (Sep 24), so "yesterday" must be Sep 23, not
    // Sep 22.
    const now = new Date("2026-09-23T20:00:00.000Z");
    const { start, end } = previousIstDayRange(now);
    expect(start.toISOString()).toBe("2026-09-22T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-09-23T18:30:00.000Z");
  });

  it("treats the exact IST midnight boundary as the start of the new day, not the end of the old one", () => {
    // Hand-verified independently in Python: 18:30 UTC on Sep 22 is
    // exactly 00:00:00 IST on Sep 23.
    const now = new Date("2026-09-22T18:30:00.000Z");
    const { start, end } = previousIstDayRange(now);
    expect(start.toISOString()).toBe("2026-09-21T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-09-22T18:30:00.000Z");
  });

  it("always returns a real, exact 24-hour period regardless of when it is called", () => {
    const { start, end } = previousIstDayRange(new Date());
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("defaults to the real current time when no argument is given", () => {
    const before = Date.now();
    const { end } = previousIstDayRange();
    const after = Date.now();
    // end is "today's IST midnight" - it must be within the last 24h
    // of a real call, not an arbitrary or stale value.
    expect(end.getTime()).toBeLessThanOrEqual(after + 1000);
    expect(end.getTime()).toBeGreaterThan(before - 24 * 60 * 60 * 1000);
  });
});
