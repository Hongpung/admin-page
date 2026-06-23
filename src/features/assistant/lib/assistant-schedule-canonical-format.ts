/**
 * 시간표 슬롯 파싱·정규화 유틸.
 * 프롬프트 문자열은 `@admin/features/assistant/constants/assistant-prompts/schedule`에 정의됩니다.
 */
export {
  SCHEDULE_CANONICAL_ACTION_PROMPT,
  SCHEDULE_CANONICAL_FORMAT_PROMPT,
  SCHEDULE_CANONICAL_SLOT_FORMAT,
  SCHEDULE_GRID_CELL_FILL_PROMPT,
  SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT,
  SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT,
  SCHEDULE_TIME_SNAP_HINT,
} from "@admin/features/assistant/constants/assistant-prompts/schedule";

export type ScheduleSlotKind =
  | "regular"
  | "common-open"
  | "common-closed"
  | "external";

export type ParsedScheduleSlotKind = {
  reservationType: "COMMON" | "REGULAR" | "EXTERNAL";
  participationAvailable: boolean;
};

const CLUB_TITLE_PATTERN = /(?:풍물패|동아리|학회|악반)(?:\s|$)/;

/** 동아리 단위 예약명인지 (파트·소그룹 연습명은 제외) */
export function isClubReservationTitle(title: string): boolean {
  return CLUB_TITLE_PATTERN.test(title.trim());
}

/** 담당 회원 없이 연습명 자체가 외부 예약자인 슬롯 (예: 판굿 모임) */
export function isTitleOnlyExternalScheduleSlot(slot: {
  title: string;
  creatorName: string;
  kindHint?: string | null;
}): boolean {
  const title = slot.title.trim();
  if (!title) return false;
  if (inferScheduleSlotKind(title, slot.kindHint) === "external") return true;
  if (/판굿\s*모임/i.test(title)) return true;

  const creator = slot.creatorName.trim();
  return creator.length > 0 && creator === title;
}

export function buildTitleOnlyExternalReservationPayload(
  slot: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  },
): Record<string, unknown> {
  const title = slot.title.trim();

  return {
    title,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    reservationType: "EXTERNAL",
    participationAvailable: false,
    externalCreatorName: title,
  };
}

/** title·힌트로 예약 유형·오픈 여부 추정 */
export function inferScheduleSlotKind(
  title: string,
  hint?: string | null,
): ScheduleSlotKind {
  const normalizedHint = hint?.trim().toUpperCase() ?? "";

  if (normalizedHint.includes("EXTERNAL")) return "external";
  if (normalizedHint.includes("CLOSED")) return "common-closed";
  if (normalizedHint.includes("OPEN")) return "common-open";
  if (normalizedHint.includes("COMMON")) return "common-closed";
  if (normalizedHint.includes("REGULAR")) {
    return isClubReservationTitle(title) ? "regular" : "common-closed";
  }

  if (isClubReservationTitle(title)) {
    return "regular";
  }

  return "common-closed";
}

export function scheduleSlotKindToReservation(
  kind: ScheduleSlotKind,
  creatorId: number | null,
): ParsedScheduleSlotKind {
  if (kind === "external") {
    return {
      reservationType: "EXTERNAL",
      participationAvailable: false,
    };
  }

  if (creatorId != null && kind === "regular") {
    return {
      reservationType: "REGULAR",
      participationAvailable: false,
    };
  }

  if (creatorId != null) {
    return {
      reservationType: "COMMON",
      participationAvailable: kind === "common-open",
    };
  }

  if (kind === "regular") {
    return {
      reservationType: "REGULAR",
      participationAvailable: false,
    };
  }

  return {
    reservationType: "COMMON",
    participationAvailable: kind === "common-open",
  };
}
