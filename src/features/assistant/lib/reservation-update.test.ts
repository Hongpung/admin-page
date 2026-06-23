import { describe, expect, it } from "vitest";
import {
  enrichAnalysisWithReservationFromLookup,
  extractReservationIdFromMessage,
} from "./enrich-reservation-from-lookup";
import { extractReservationUpdateFieldsFromMessage } from "./prefill-reservation-update-from-message";
import { buildReservationPatchBody } from "./build-reservation-patch-body";
import {
  hasReservationCreateIntent,
  hasReservationUpdateIntent,
} from "./assistant-reservation-intent";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";

const baseAnalysis: AssistantAnalysis = {
  summary: "",
  detected_text: "",
  admin_action_required: false,
  recommended_action: "",
  confidence: 0.5,
  fallback_required: false,
  action: { type: "NONE" },
};

describe("hasReservationUpdateIntent", () => {
  it("detects update intent separately from create", () => {
    const message = "설장구 예약의 종료 시간을 13시로 수정해줘";
    expect(hasReservationUpdateIntent(message)).toBe(true);
    expect(hasReservationCreateIntent(message)).toBe(false);
  });

  it("detects update intent without the word 예약", () => {
    const message = "설장구 13시까지인데 왜 12시 반까지로 됐지? 수정해줘";
    expect(hasReservationUpdateIntent(message)).toBe(true);
  });
});

describe("extractReservationUpdateFieldsFromMessage", () => {
  it("extracts endTime from labeled end-time phrase", () => {
    expect(
      extractReservationUpdateFieldsFromMessage(
        "설장구 예약의 종료 시간을 13시로 수정",
      ).endTime,
    ).toBe("13:00");
  });

  it("extracts endTime from N시까지 phrase", () => {
    expect(
      extractReservationUpdateFieldsFromMessage(
        "설장구 13시까지로 수정해줘",
      ).endTime,
    ).toBe("13:00");
  });
});

describe("enrichAnalysisWithReservationFromLookup", () => {
  it("builds UPDATE_RESERVATION from lookup match", () => {
    const message = "설장구 예약의 종료 시간을 13시로 수정";
    const enriched = enrichAnalysisWithReservationFromLookup(
      baseAnalysis,
      message,
      [
        {
          callId: "week-1",
          toolId: "reservations_by_week_lookup",
          args: { weekOffset: 0 },
          ok: true,
          message: "ok",
          data: {
            reservations: [
              {
                reservationId: 42,
                title: "설장구",
                date: "2026-07-07",
                startTime: "11:00",
                endTime: "12:00",
              },
            ],
          },
        },
      ],
    );

    expect(enriched.action?.type).toBe("UPDATE_RESERVATION");
    expect(enriched.action?.payload).toMatchObject({
      reservationId: 42,
      endTime: "13:00",
    });
    expect(enriched.admin_action_required).toBe(true);
  });

  it("uses explicit reservation id from message", () => {
    const message = "예약 ID 99 종료 시간을 15시로 변경";
    expect(extractReservationIdFromMessage(message)).toBe(99);

    const enriched = enrichAnalysisWithReservationFromLookup(
      baseAnalysis,
      message,
      [],
    );

    expect(enriched.action?.type).toBe("UPDATE_RESERVATION");
    expect(enriched.action?.payload).toMatchObject({
      reservationId: 99,
      endTime: "15:00",
    });
  });
});

describe("buildReservationPatchBody", () => {
  it("merges partial patch with existing reservation detail", () => {
    const body = buildReservationPatchBody(
      {
        reservationId: 1,
        title: "설장구",
        date: "2026-07-07",
        startTime: "11:00",
        endTime: "12:00",
        creatorName: "회원나",
        creatorNickname: "",
        reservationType: "REGULAR",
        participationAvailable: false,
        amountOfParticipators: 0,
        creatorId: 7,
      },
      { endTime: "13:00" },
    );

    expect(body).toMatchObject({
      title: "설장구",
      date: "2026-07-07",
      startTime: "11:00",
      endTime: "13:00",
      reservationType: "REGULAR",
      participationAvailable: false,
      creatorId: 7,
    });
  });
});
