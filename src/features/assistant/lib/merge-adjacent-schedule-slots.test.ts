import { describe, expect, it } from "vitest";
import { inferScheduleSlotKind } from "./assistant-schedule-canonical-format";
import { extractDatedScheduleSlotsFromText } from "./extract-dated-schedule-slots";
import { mergeAdjacentDatedScheduleSlots } from "./merge-adjacent-schedule-slots";

const WEEK_SCHEDULE = `2026-07-06, 11:00-13:00, 오금반, 담당가 ; REGULAR
2026-07-06, 13:00-15:00, 오금반, 담당가 ; REGULAR
2026-07-06, 15:00-17:00, 고깔소고춤, 담당다 ; COMMON ; closed
2026-07-06, 17:00-19:00, 고깔소고춤, 담당다 ; COMMON ; closed
2026-07-07, 11:00-13:00, 설장구, 담당라 ; COMMON ; closed
2026-07-07, 13:00-15:00, 판굿 소고, 담당나 ; COMMON ; closed
2026-07-07, 15:00-17:00, 판굿 소고, 담당나 ; COMMON ; closed
2026-07-07, 17:00-19:00, 통북놀이, 담당마 ; COMMON ; closed
2026-07-08, 11:00-13:00, 설장구, 담당라 ; COMMON ; closed
2026-07-08, 13:00-15:00, 판굿 소고, 담당나 ; COMMON ; closed
2026-07-08, 15:00-17:00, 쇠 통합반, 담당바 ; REGULAR
2026-07-08, 17:00-19:00, 판굿 북, 담당가 ; COMMON ; closed
2026-07-09, 11:00-13:00, 설장구, 담당라 ; COMMON ; closed
2026-07-09, 13:00-15:00, 쇠 통합반, 담당바 ; REGULAR
2026-07-09, 15:00-17:00, 쇠 통합반, 담당바 ; REGULAR
2026-07-09, 17:00-19:00, 통북놀이, 담당마 ; COMMON ; closed
2026-07-10, 11:00-13:00, 판굿 장구, 담당사 ; COMMON ; closed
2026-07-10, 13:00-15:00, 판굿 장구, 담당사 ; COMMON ; closed
2026-07-10, 15:00-17:00, 통북놀이, 담당마 ; COMMON ; closed
2026-07-10, 17:00-19:00, 판굿 북, 담당가 ; COMMON ; closed`;

describe("mergeAdjacentDatedScheduleSlots", () => {
  it("merges back-to-back slots with same date, title, creator, and kind", () => {
    const slots = extractDatedScheduleSlotsFromText("7월 6일부터", WEEK_SCHEDULE);

    expect(slots).toHaveLength(15);
    expect(slots).toContainEqual({
      date: "2026-07-06",
      startTime: "11:00",
      endTime: "15:00",
      title: "오금반",
      creatorName: "담당가",
      kindHint: "REGULAR",
    });
    expect(slots).toContainEqual({
      date: "2026-07-06",
      startTime: "15:00",
      endTime: "19:00",
      title: "고깔소고춤",
      creatorName: "담당다",
      kindHint: "COMMON ; closed",
    });
    expect(slots).toContainEqual({
      date: "2026-07-09",
      startTime: "13:00",
      endTime: "17:00",
      title: "쇠 통합반",
      creatorName: "담당바",
      kindHint: "REGULAR",
    });
  });

  it("does not merge when title or creator differs", () => {
    const merged = mergeAdjacentDatedScheduleSlots([
      {
        date: "2026-07-08",
        startTime: "15:00",
        endTime: "17:00",
        title: "쇠 통합반",
        creatorName: "담당바",
        kindHint: "REGULAR",
      },
      {
        date: "2026-07-08",
        startTime: "17:00",
        endTime: "19:00",
        title: "판굿 북",
        creatorName: "담당가",
        kindHint: "COMMON ; closed",
      },
    ]);

    expect(merged).toHaveLength(2);
  });
});

describe("inferScheduleSlotKind club vs practice titles", () => {
  it("treats practice subgroup names as COMMON even with REGULAR hint", () => {
    expect(inferScheduleSlotKind("오금반", "REGULAR")).toBe("common-closed");
    expect(inferScheduleSlotKind("쇠 통합반", "REGULAR")).toBe("common-closed");
    expect(inferScheduleSlotKind("고깔소고춤", "COMMON ; closed")).toBe(
      "common-closed",
    );
  });

  it("keeps REGULAR only for club-level titles", () => {
    expect(inferScheduleSlotKind("홍익 풍물패", "REGULAR")).toBe("regular");
    expect(inferScheduleSlotKind("OO 동아리", null)).toBe("regular");
  });
});
