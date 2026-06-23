import { describe, expect, it } from "vitest";
import {
  buildTitleOnlyExternalReservationPayload,
  inferScheduleSlotKind,
  isTitleOnlyExternalScheduleSlot,
  scheduleSlotKindToReservation,
  SCHEDULE_GRID_CELL_FILL_PROMPT,
  SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT,
  SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT,
} from "./assistant-schedule-canonical-format";
import { extractDatedScheduleSlotsFromText } from "./extract-dated-schedule-slots";

describe("canonical schedule format", () => {
  it("parses comma-separated YYYY-MM-DD, HH:mm-HH:mm, title, creator lines", () => {
    const detected = `사전전수 시간표
2026-07-06, 13:00-15:00, 오금반, 담당가 ; REGULAR
2026-07-06, 15:00-17:00, 고깔소고춤, 담당다 ; COMMON ; open
2026-07-07, 11:00-13:00, 설장구, 담당라 ; COMMON ; closed`;

    const slots = extractDatedScheduleSlotsFromText("2026년 7월", detected);

    expect(slots).toHaveLength(3);
    expect(slots[0]).toMatchObject({
      date: "2026-07-06",
      startTime: "13:00",
      endTime: "15:00",
      title: "오금반",
      creatorName: "담당가",
      kindHint: "REGULAR",
    });
  });

  it("still parses legacy hyphen-separated canonical lines", () => {
    const detected = `2026-07-06-13:00-15:00 오금반, 담당가 ; REGULAR`;

    const slots = extractDatedScheduleSlotsFromText("2026년 7월", detected);

    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({
      date: "2026-07-06",
      title: "오금반",
      creatorName: "담당가",
    });
  });

  it("infers regular vs common from title and hints", () => {
    expect(inferScheduleSlotKind("오금반", "REGULAR")).toBe("common-closed");
    expect(inferScheduleSlotKind("오금반", null)).toBe("common-closed");
    expect(inferScheduleSlotKind("고깔소고춤", "COMMON ; closed")).toBe(
      "common-closed",
    );

    expect(
      scheduleSlotKindToReservation("regular", 12),
    ).toEqual({
      reservationType: "REGULAR",
      participationAvailable: false,
    });
    expect(
      scheduleSlotKindToReservation("common-open", 12),
    ).toEqual({
      reservationType: "COMMON",
      participationAvailable: true,
    });
  });
});

describe("isTitleOnlyExternalScheduleSlot", () => {
  it("treats 판굿 모임 as EXTERNAL with title as external name", () => {
    const slot = {
      title: "판굿 모임",
      creatorName: "판굿 모임",
      kindHint: "EXTERNAL",
    };

    expect(isTitleOnlyExternalScheduleSlot(slot)).toBe(true);
    expect(buildTitleOnlyExternalReservationPayload({
      ...slot,
      date: "2026-07-11",
      startTime: "11:00",
      endTime: "21:00",
    })).toEqual({
      title: "판굿 모임",
      date: "2026-07-11",
      startTime: "11:00",
      endTime: "21:00",
      reservationType: "EXTERNAL",
      participationAvailable: false,
      externalCreatorName: "판굿 모임",
    });
  });

  it("does not treat named member practice as title-only external", () => {
    expect(
      isTitleOnlyExternalScheduleSlot({
        title: "설장구",
        creatorName: "담당라",
        kindHint: "COMMON ; closed",
      }),
    ).toBe(false);
  });
});

describe("SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT", () => {
  it("separates grid timetable from D503 weekly assignment", () => {
    expect(SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT).toContain("교시 격자");
    expect(SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT).toContain("D503");
    expect(SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT).not.toContain("사전전수");
    expect(SCHEDULE_IMAGE_TYPE_ROUTING_PROMPT).toContain(
      "반칸·교시·:30 보정 적용 금지",
    );
  });
});

describe("SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT", () => {
  it("uses explicit cell times and batch create for room schedules", () => {
    expect(SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT).toContain(
      "RESERVATION_BATCH_CREATE",
    );
    expect(SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT).toContain("17:00~23:00");
    expect(SCHEDULE_ROOM_WEEKLY_ASSIGNMENT_PROMPT).toContain(
      "반칸·:30 보정",
    );
  });
});

describe("SCHEDULE_GRID_CELL_FILL_PROMPT", () => {
  it("includes merged-cell full vs partial fill guidance", () => {
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain("A형 전용");
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain("꽉 찬 칸");
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain("반만 찬 칸");
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain("15:00-19:00");
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain("fallback_required");
  });

  it("documents 30-minute offsets for half-filled cells", () => {
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain("11:30-15:00");
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain("17:00-19:30");
    expect(SCHEDULE_GRID_CELL_FILL_PROMPT).toContain(":30");
  });
});
