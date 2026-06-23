import { describe, expect, it } from "vitest";
import { extractReservationCreatorName } from "./assistant-member-intent";
import { enrichAnalysisWithCreatorFromLookup } from "./build-creator-from-lookup";
import { analyzeAssistantToolSchemaGaps } from "./format-assistant-missing-fields";
import {
  enrichAnalysisWithReservationBatchMessagePrefill,
  extractReservationBatchFieldsFromMessage,
  parseWeekDaysFromMessage,
  resolveBatchDurationFromMessage,
} from "./prefill-reservation-batch-from-message";
import type { AssistantToolResultEntry } from "./assistant-tool-loop";

const BATCH_MESSAGE =
  "매주 월요일 7시부터 2시간 정기연습 회원가 주최자로 다음달까지";

describe("parseWeekDaysFromMessage", () => {
  it("parses single and compact weekday lists", () => {
    expect(parseWeekDaysFromMessage("매주 월요일 7시")).toEqual(["월"]);
    expect(parseWeekDaysFromMessage("매주 월수금 7시")).toEqual([
      "월",
      "수",
      "금",
    ]);
  });
});

describe("resolveBatchDurationFromMessage", () => {
  it("defaults start to tomorrow and end to next month last day", () => {
    const duration = resolveBatchDurationFromMessage(BATCH_MESSAGE);

    expect(duration.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(duration.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(duration.endDate?.endsWith("-31") || duration.endDate?.endsWith("-30")).toBe(
      true,
    );
  });
});

describe("extractReservationBatchFieldsFromMessage", () => {
  it("parses dayTimes, duration, and batch option from natural language", () => {
    const fields = extractReservationBatchFieldsFromMessage(BATCH_MESSAGE);

    expect(fields.dayTimes).toEqual([
      { day: "월", startTime: "10:00", endTime: "12:00" },
    ]);
    expect(fields.duration).toMatchObject({
      startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(fields.batchReservationOption).toMatchObject({
      title: "정기연습",
      reservationType: "REGULAR",
    });
  });
});

describe("extractReservationCreatorName for batch message", () => {
  it("extracts host name from 주최자 phrasing", () => {
    expect(extractReservationCreatorName(BATCH_MESSAGE)).toBe("회원가");
  });
});

describe("enrichAnalysisWithReservationBatchMessagePrefill", () => {
  const memberLookupResults: AssistantToolResultEntry[] = [
    {
      callId: "1",
      toolId: "members_search_lookup",
      args: { username: "회원가", page: 0, pageSize: 20 },
      ok: true,
      message: "ok",
      data: {
        members: [{ memberId: 42, name: "회원가", nickname: "회원가별칭" }],
        totalCount: 1,
      },
    },
  ];

  it("prefills batch payload and reduces schema gaps", () => {
    const enriched = enrichAnalysisWithReservationBatchMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.9,
        fallback_required: false,
        action: {
          type: "RESERVATION_BATCH_CREATE",
          payload: {},
        },
      },
      BATCH_MESSAGE,
    );

    expect(enriched.action?.type).toBe("RESERVATION_BATCH_CREATE");
    expect(enriched.action?.payload).toMatchObject({
      dayTimes: [{ day: "월", startTime: "10:00", endTime: "12:00" }],
      duration: {
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      },
      batchReservationOption: {
        title: "정기연습",
        reservationType: "REGULAR",
      },
    });

    const gaps = analyzeAssistantToolSchemaGaps(
      "reservation_batch_create",
      enriched.action?.payload ?? {},
    );
    const gapPaths = gaps.map((item) => item.path);
    expect(gapPaths).not.toContain("dayTimes");
    expect(gapPaths).not.toContain("duration.startDate");
    expect(gapPaths).not.toContain("duration.endDate");
    expect(gapPaths).not.toContain("batchReservationOption.title");
    expect(gapPaths.some((path) => path.includes("creatorName"))).toBe(true);
  });

  it("merges creatorId from member lookup into batchReservationOption", () => {
    const prefilled = enrichAnalysisWithReservationBatchMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.7,
        fallback_required: false,
        action: { type: "RESERVATION_BATCH_CREATE", payload: {} },
      },
      BATCH_MESSAGE,
    );

    const withCreator = enrichAnalysisWithCreatorFromLookup(
      prefilled,
      BATCH_MESSAGE,
      memberLookupResults,
    );

    expect(withCreator.action?.payload?.batchReservationOption).toMatchObject({
      creatorId: 42,
      reservationType: "REGULAR",
      title: "정기연습",
    });

    const gaps = analyzeAssistantToolSchemaGaps(
      "reservation_batch_create",
      withCreator.action?.payload ?? {},
    );
    expect(gaps).toEqual([]);
  });

  it("does not overwrite existing payload fields", () => {
    const enriched = enrichAnalysisWithReservationBatchMessagePrefill(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.9,
        fallback_required: false,
        action: {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            batchReservationOption: {
              title: "합주",
              reservationType: "COMMON",
            },
          },
        },
      },
      BATCH_MESSAGE,
    );

    expect(enriched.action?.payload?.batchReservationOption).toMatchObject({
      title: "합주",
      reservationType: "COMMON",
    });
  });
});
