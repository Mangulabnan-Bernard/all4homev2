import { Prisma } from "@prisma/client";

type Decimalish = Prisma.Decimal | number | string;

/** Format a money amount (Prisma Decimal, number, or string) as USD. */
export function formatCurrency(amount: Decimalish, currency = "USD"): string {
  const value = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

/** A Decimal can't be sent to a client component; convert it to a plain number for DTOs. */
export function decimalToNumber(value: Prisma.Decimal | number | string): number {
  return typeof value === "object" ? value.toNumber() : Number(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

/** Relative-time like "3 hours ago" for notification/message lists. */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return rtf.format(Math.round(diffMs / 1000), "second");
}
