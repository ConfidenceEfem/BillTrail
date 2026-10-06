
export function advanceByFrequency(date: Date, frequency: "WEEKLY" | "MONTHLY"): Date {
  const result = new Date(date);

  if (frequency === "WEEKLY") {
    result.setUTCDate(result.getUTCDate() + 7);
    return result;
  }

  // MONTHLY
  const originalDay = result.getUTCDate();
  result.setUTCDate(1); // avoid the month-rollover trap by moving to a safe day first
  result.setUTCMonth(result.getUTCMonth() + 1);

  const daysInNewMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, daysInNewMonth));

  return result;
}