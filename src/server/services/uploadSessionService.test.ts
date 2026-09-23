import { describe, expect, it } from "vitest";
import { isCovered, normalizeRanges } from "./uploadSessionService";

describe("uploadSessionService range semantics", () => {
  it("merges adjacent and overlapping chunks into one resumable range", () => {
    expect(
      normalizeRanges([
        { start: 10, end: 19 },
        { start: 0, end: 9 },
        { start: 18, end: 31 },
      ]),
    ).toEqual([{ start: 0, end: 31 }]);
  });

  it("does not claim a complete upload when bytes are missing", () => {
    expect(isCovered([{ start: 0, end: 99 }], 200)).toBe(false);
    expect(isCovered([{ start: 0, end: 199 }], 200)).toBe(true);
  });

  it("keeps malformed ranges out of the persisted set", () => {
    expect(
      normalizeRanges([
        { start: -1, end: 4 },
        { start: 4.5, end: 9 },
        { start: 20, end: 25 },
      ]),
    ).toEqual([{ start: 20, end: 25 }]);
  });
});
