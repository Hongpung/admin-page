import type { Key } from "react";
import type { InternalTableProps } from "./types";

export function resolveRowKey<T>(
  record: T,
  rowKey: InternalTableProps<T>["rowKey"],
): Key {
  if (typeof rowKey === "function") return rowKey(record);
  return (record as Record<string, unknown>)[rowKey as string] as Key;
}
