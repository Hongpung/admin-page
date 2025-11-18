import { DAYS_KO } from "../constants/session-ui.constants";

export function toDateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateFromDateKey(dateKey: string): Date | null {
  const parts = dateKey.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const [y, m, d] = parts;
  if (y == null || m == null || d == null) return null;

  const out = new Date(y, m - 1, d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function weekdayFromSessionDate(date: string): string {
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return "";
  return DAYS_KO[new Date(t).getDay()] ?? "";
}
