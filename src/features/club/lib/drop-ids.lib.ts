import type { UniqueIdentifier } from "@dnd-kit/core";
import {
  MEMBER_DROP_ID_PREFIX,
  SLOT_DROP_ID_PREFIX,
} from "../constants/primary.constants";
import type { ColumnId } from "../types/primary-members";

export function createMemberDropId(memberId: number): string {
  return `${MEMBER_DROP_ID_PREFIX}${memberId}`;
}

export function parseMemberDropId(id: UniqueIdentifier): number | null {
  if (typeof id !== "string" || !id.startsWith(MEMBER_DROP_ID_PREFIX)) {
    return null;
  }

  const rawId = id.slice(MEMBER_DROP_ID_PREFIX.length);
  if (!/^\d+$/.test(rawId)) return null;
  return Number(rawId);
}

export function createSlotDropId(columnId: ColumnId, index: number): string {
  return `${SLOT_DROP_ID_PREFIX}${columnId}:${index}`;
}

export function parseSlotDropId(
  id: UniqueIdentifier
): { columnId: ColumnId; index: number } | null {
  if (typeof id !== "string" || !id.startsWith(SLOT_DROP_ID_PREFIX)) {
    return null;
  }

  const raw = id.slice(SLOT_DROP_ID_PREFIX.length);
  const [columnRaw, indexRaw] = raw.split(":");
  if (
    (columnRaw !== "inactive" && columnRaw !== "active") ||
    !/^\d+$/.test(indexRaw ?? "")
  ) {
    return null;
  }

  return {
    columnId: columnRaw,
    index: Number(indexRaw),
  };
}

export function getClientYFromDragEvent(event: Event | null): number | null {
  if (!event) return null;

  if (event instanceof MouseEvent || event instanceof PointerEvent) {
    return event.clientY;
  }

  if (typeof TouchEvent !== "undefined" && event instanceof TouchEvent) {
    if (event.touches.length > 0) {
      return event.touches[0]?.clientY ?? null;
    }
    if (event.changedTouches.length > 0) {
      return event.changedTouches[0]?.clientY ?? null;
    }
  }

  return null;
}
