import { describe, expect, it } from "vitest";
import { advanceByFrequency } from "../src/modules/recurring-invoices/recurring-date-math";

describe("advanceByFrequency", () => {
  it("adds 7 days for WEEKLY", () => {
    const result = advanceByFrequency(new Date("2026-01-15T00:00:00.000Z"), "WEEKLY");
    expect(result.toISOString()).toBe("2026-01-22T00:00:00.000Z");
  });

  it("adds one calendar month for a normal MONTHLY date", () => {
    const result = advanceByFrequency(new Date("2026-01-15T00:00:00.000Z"), "MONTHLY");
    expect(result.toISOString()).toBe("2026-02-15T00:00:00.000Z");
  });

  it("clamps Jan 31 to Feb 28 in a non-leap year", () => {
    const result = advanceByFrequency(new Date("2026-01-31T00:00:00.000Z"), "MONTHLY");
    expect(result.toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("clamps Jan 31 to Feb 29 in a leap year", () => {
    const result = advanceByFrequency(new Date("2027-01-31T00:00:00.000Z"), "MONTHLY");
    // 2028 is a leap year (divisible by 4, not a century exception)
    const feb2028 = advanceByFrequency(new Date("2028-01-31T00:00:00.000Z"), "MONTHLY");
    expect(feb2028.toISOString()).toBe("2028-02-29T00:00:00.000Z");
    void result;
  });

  it("rolls over the year correctly from December", () => {
    const result = advanceByFrequency(new Date("2026-12-31T00:00:00.000Z"), "MONTHLY");
    expect(result.toISOString()).toBe("2027-01-31T00:00:00.000Z");
  });

  it("does not clamp a day that exists in every month", () => {
    const result = advanceByFrequency(new Date("2026-03-15T00:00:00.000Z"), "MONTHLY");
    expect(result.toISOString()).toBe("2026-04-15T00:00:00.000Z");
  });
});