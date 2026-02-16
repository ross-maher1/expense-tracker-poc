/**
 * App constants and configuration.
 *
 * >>> Update APP_NAME when you create your app. <<<
 *
 * Define all constants, enums, and configuration values here.
 * Avoid hardcoding values in components.
 *
 * Example:
 *
 * export const CATEGORIES = ["work", "personal", "urgent"] as const;
 * export type Category = (typeof CATEGORIES)[number];
 *
 * export const STATUS_LABELS: Record<string, string> = {
 *   pending: "Pending",
 *   complete: "Complete",
 * };
 */

export const APP_NAME = "Mini App";

export const STORAGE_KEYS = {
  settings: "mini_app_settings",
} as const;
