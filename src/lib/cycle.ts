import { format, addMonths, differenceInCalendarMonths, parseISO } from "date-fns";

/**
 * Returns the 1-based current cycle month for a group, clamped to [1, cycleLength].
 * If the group hasn't started yet, returns 1.
 */
export function currentCycleMonth(startMonth: string, cycleLength: number): number {
  const start = typeof startMonth === "string" ? parseISO(startMonth) : startMonth;
  const diff = differenceInCalendarMonths(new Date(), start);
  if (diff < 0) return 1;
  return Math.min(diff + 1, cycleLength);
}

export function monthLabel(startMonth: string, cycleMonth: number): string {
  const start = parseISO(startMonth);
  return format(addMonths(start, cycleMonth - 1), "MMM yyyy");
}

export function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
