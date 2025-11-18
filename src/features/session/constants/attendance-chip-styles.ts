import type { SessionAttendanceStatusLabel } from "../types";

export function attendanceChipClass(
  status: SessionAttendanceStatusLabel,
  selected: boolean,
): string {
  const muted =
    status === "결석"
      ? "border-gray-300 text-gray-600 bg-gray-50"
      : "border-blue-200 text-blue-700 bg-blue-50";
  const active =
    status === "결석"
      ? "border-gray-500 text-gray-800 bg-gray-100"
      : "border-blue-500 text-blue-800 bg-blue-100";
  return `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    selected ? active : muted
  }`;
}
