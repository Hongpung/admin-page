import { describe, expect, it } from "vitest";
import {
  analyzeAssistantToolSchemaGaps,
  appendMissingFieldsToSummary,
  buildMissingFieldsRecommendedAction,
} from "./format-assistant-missing-fields";

describe("analyzeAssistantToolSchemaGaps", () => {
  it("lists concrete schema gaps for empty force-create payload", () => {
    const gaps = analyzeAssistantToolSchemaGaps(
      "reservation_force_create",
      {},
    );

    expect(gaps.map((item) => item.path)).toEqual(
      expect.arrayContaining([
        "title",
        "date",
        "startTime",
        "endTime",
        "participationAvailable",
        "reservationType",
      ]),
    );
    expect(gaps.every((item) => item.display.includes("["))).toBe(true);
    expect(gaps.every((item) => item.display.includes("]"))).toBe(true);
  });

  it("reports only creatorName when other fields are filled", () => {
    const gaps = analyzeAssistantToolSchemaGaps("reservation_force_create", {
      title: "정기연습",
      date: "2099-07-05",
      startTime: "19:00",
      endTime: "20:00",
      participationAvailable: false,
      reservationType: "REGULAR",
    });

    expect(gaps.map((item) => item.path)).toEqual(["creatorName"]);
    expect(gaps[0]?.display).toContain("creatorName");
  });

  it("reports notice create gaps from schema", () => {
    const gaps = analyzeAssistantToolSchemaGaps("notice_create", {});

    expect(gaps.map((item) => item.path)).toEqual(
      expect.arrayContaining(["title", "content"]),
    );
    expect(gaps.find((item) => item.path === "title")?.label).toBe("공지 제목");
  });

  it("hides creator fields until reservationType is chosen", () => {
    const gaps = analyzeAssistantToolSchemaGaps("reservation_force_create", {
      date: "2026-07-05",
      startTime: "19:00",
      endTime: "20:00",
    });

    expect(gaps.map((item) => item.path)).toEqual(
      expect.arrayContaining(["title", "reservationType", "participationAvailable"]),
    );
    expect(gaps.map((item) => item.path)).not.toContain("creatorId");
    expect(gaps.map((item) => item.path)).not.toContain("creatorName");
  });

  it("reports delete and update gaps with concrete field names", () => {
    expect(
      analyzeAssistantToolSchemaGaps("reservation_force_delete", {}).map(
        (item) => item.path,
      ),
    ).toEqual(["reservationId"]);

    expect(
      analyzeAssistantToolSchemaGaps("notice_update", { noticeId: 1 }).map(
        (item) => item.path,
      ),
    ).toEqual(["patch"]);

    expect(
      analyzeAssistantToolSchemaGaps("banner_update", { bannerId: 2 }).map(
        (item) => item.path,
      ),
    ).toEqual(["patch"]);
  });
});

describe("buildMissingFieldsRecommendedAction", () => {
  it("includes schema field paths and messages", () => {
    const gaps = analyzeAssistantToolSchemaGaps("reservation_force_create", {
      reservationType: "REGULAR",
    });
    const message = buildMissingFieldsRecommendedAction(
      "reservation_force_create",
      gaps,
    );

    expect(message).toContain("아래 필드가 더 필요합니다");
    expect(message).toContain("creatorName");
    expect(message).not.toContain("payload");
  });
});

describe("appendMissingFieldsToSummary", () => {
  it("appends missing field note to optimistic summary", () => {
    const gaps = analyzeAssistantToolSchemaGaps("reservation_force_create", {
      reservationType: "REGULAR",
      title: "정기연습",
      date: "2026-07-05",
      startTime: "19:00",
      endTime: "20:00",
      participationAvailable: false,
    });

    const summary = appendMissingFieldsToSummary(
      "내일 오후 7시부터 회원가님 이름으로 예약을 생성합니다.",
      gaps,
    );

    expect(summary).toContain("생성합니다");
    expect(summary).toContain("creatorName");
  });
});
