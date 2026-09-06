import { afterEach, describe, expect, it } from "vitest";
import { register } from "./instrumentation";

describe("instrumentation.register", () => {
  afterEach(() => {
    // Real, necessary cleanup: this patches a global prototype, which
    // would otherwise leak into every other test file sharing this
    // process - restoring it after each test keeps this test's real
    // effect isolated to itself.
    delete (BigInt.prototype as unknown as Record<string, unknown>).toJSON;
  });

  it("makes JSON.stringify succeed on a real BigInt, which throws unconditionally without this fix", () => {
    // Confirms the real problem exists before the fix is applied -
    // without this, the test below would prove nothing.
    expect(() => JSON.stringify({ amount: 50_000_000n })).toThrow();

    register();

    expect(() => JSON.stringify({ amount: 50_000_000n })).not.toThrow();
  });

  it("converts a real BigInt to the correct plain number when serialized, matching the precision behavior of the existing service-layer fixes", () => {
    register();

    const serialized = JSON.stringify({ amount: 50_000_000n });

    expect(JSON.parse(serialized)).toEqual({ amount: 50_000_000 });
  });

  it("still serializes ordinary values normally - this fix touches only BigInt, nothing else", () => {
    register();

    const serialized = JSON.stringify({
      name: "test",
      count: 5,
      amount: 100n,
      nested: { active: true },
    });

    expect(JSON.parse(serialized)).toEqual({
      name: "test",
      count: 5,
      amount: 100,
      nested: { active: true },
    });
  });
});
