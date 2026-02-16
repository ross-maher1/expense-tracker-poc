/**
 * Shared utility functions.
 *
 * Keep utilities pure and well-typed. Add type guards for
 * discriminated unions here.
 */

/**
 * Generate a unique ID using crypto.randomUUID with fallback.
 */
export const createId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Format a date string for display.
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

/**
 * Format currency for display.
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(value || 0);

/**
 * Safely parse JSON with a fallback value.
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};
