import { describe, expect, it } from "vitest";
import { extractReservationCreatorName } from "./assistant-member-intent";
import {
  enrichAnalysisWithReservationMessagePrefill,
  extractReservationFieldsFromMessage,
} from "./prefill-reservation-from-message";
import { analyzeAssistantToolSchemaGaps } from "./format-assistant-missing-fields";

const USER_MESSAGE =
  "내일 오후 1시부터 2시간짜리 연습을 회원가를 주최자로 생성해줘";

describe("extractReservationFieldsFromMessage", () => {
  it("parses date, time range, title, and defaults from natural language", () => {
    const fields = extractReservationFieldsFromMessage(USER_MESSAGE);

    expect(fields.title).toBe("연습");
    expect(fields.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fields.startTime).toBe("13:00");
    expect(fields.endTime).toBe("15:00");
    expect(fields.reservationType).toBe("REGULAR");
    expect(fields.participationAvailable).toBe(false);
  });
});

describe("extractReservationCreatorName", () => {
  it("extracts host name without the word 예약", () => {
    expect(extractReservationCreatorName(USER_MESSAGE)).toBe("회원가");
  });
});

describe("enrichAnalysisWithReservationMessagePrefill", () => {
  it("prefills only missing payload fields and reduces schema gaps", () => {
    const enriched = enrichAnalysisWithReservationMessagePrefill(
      {
        summary:
          "요청에 따라 내일 13:00~15:00, 회원가님의 '연습' 예약을 생성합니다.",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.9,
        fallback_required: false,
        action: {
          type: "CREATE_RESERVATION",
          payload: {},
        },
      },
      USER_MESSAGE,
    );

    expect(enriched.action?.payload).toMatchObject({
      title: "연습",
      startTime: "13:00",
      endTime: "15:00",
      reservationType: "REGULAR",
      participationAvailable: false,
    });

    const gaps = analyzeAssistantToolSchemaGaps(
      "reservation_force_create",
      enriched.action?.payload ?? {},
    );
    expect(gaps.map((item) => item.path)).not.toContain("title");
    expect(gaps.map((item) => item.path)).not.toContain("date");
    expect(gaps.map((item) => item.path)).not.toContain("startTime");
    expect(gaps.map((item) => item.path)).not.toContain("endTime");
    expect(gaps.map((item) => item.path)).not.toContain("reservationType");
    expect(gaps.map((item) => item.path)).not.toContain(
      "participationAvailable",
    );
    expect(gaps.map((item) => item.path)).toEqual(["creatorName"]);
  });
});
