import { describe, expect, it } from "vitest";
import {
  buildCancelActionFromLookup,
  enrichAnalysisWithCancelIntent,
  selectReservationsForCancel,
} from "./build-cancel-action-from-lookup";
import type { AssistantToolResultEntry } from "./assistant-tool-loop";

const tomorrowLookup: AssistantToolResultEntry[] = [
  {
    callId: "1",
    toolId: "reservations_by_date_lookup",
    args: { date: "2026-07-05" },
    ok: true,
    message: "ok",
    data: {
      date: "2026-07-05",
      reservations: [
        {
          reservationId: 55,
          date: "2026-07-05",
          title: "회원가의 예약",
          creatorName: "회원가",
          startTime: "13:00",
          endTime: "15:00",
        },
        {
          reservationId: 56,
          date: "2026-07-05",
          title: "정기연습",
          creatorName: "회원나",
          startTime: "19:00",
          endTime: "20:00",
        },
      ],
    },
  },
];

describe("selectReservationsForCancel", () => {
  const reservations = [
    {
      reservationId: 55,
      title: "회원가의 예약",
      creatorName: "회원가",
    },
    {
      reservationId: 56,
      title: "정기연습",
      creatorName: "회원나",
    },
  ];

  it("filters by quoted title hint", () => {
    expect(
      selectReservationsForCancel(
        "내일 '회원가의 예약' 취소해줘",
        reservations,
      ).map((item) => item.reservationId),
    ).toEqual([55]);
  });

  it("filters by creator possessive phrase", () => {
    expect(
      selectReservationsForCancel(
        "내일 회원가의 예약 1건 취소",
        reservations,
      ).map((item) => item.reservationId),
    ).toEqual([55]);
  });

  it("filters by creator-as-reserver phrase", () => {
    expect(
      selectReservationsForCancel(
        "회원가가 예약자인 연습있으면 취소해줘",
        reservations,
      ).map((item) => item.reservationId),
    ).toEqual([55]);
  });

  it("returns empty when creator hint does not match any reservation", () => {
    expect(
      selectReservationsForCancel(
        "회원가가 예약자인 연습있으면 취소해줘",
        [
          {
            reservationId: 99,
            title: "사전전수 1일차",
            creatorName: "회원나",
          },
        ],
      ),
    ).toEqual([]);
  });

  it("selects all reservations for multi-month 다 pattern", () => {
    expect(
      selectReservationsForCancel("9월 10월 11월 12월 다", [
        { reservationId: 1, date: "2026-09-01" },
        { reservationId: 2, date: "2026-10-05" },
      ]),
    ).toEqual([
      { reservationId: 1, date: "2026-09-01" },
      { reservationId: 2, date: "2026-10-05" },
    ]);
  });
});

describe("buildCancelActionFromLookup", () => {
  it("builds single delete for targeted tomorrow reservation", () => {
    expect(
      buildCancelActionFromLookup(
        "내일(2026년 7월 5일) 예약 1건('회원가의 예약')을 취소합니다",
        tomorrowLookup,
      ),
    ).toEqual({
      type: "DELETE_RESERVATION",
      payload: { reservationId: 55 },
    });
  });

  it("builds batch delete for explicit month lookup results", () => {
    const toolResults: AssistantToolResultEntry[] = [
      {
        callId: "term-1",
        toolId: "reservations_by_term_lookup",
        args: { startDate: "2026-08-01", endDate: "2026-08-31" },
        ok: true,
        message: "ok",
        data: {
          reservations: [
            { reservationId: 101, date: "2026-08-01", title: "A" },
            { reservationId: 102, date: "2026-08-04", title: "B" },
          ],
        },
      },
    ];

    expect(
      buildCancelActionFromLookup(
        "2026년 8월 예정된 예약들을 전부 취소해줘",
        toolResults,
      ),
    ).toEqual({
      type: "DELETE_RESERVATIONS_BATCH",
      payload: { reservationIds: [101, 102] },
    });
  });
});

describe("enrichAnalysisWithCancelIntent", () => {
  it("fills reservationId when AI returned empty delete batch payload", () => {
    const enriched = enrichAnalysisWithCancelIntent(
      {
        summary:
          "내일(2026년 7월 5일) 예약 1건('회원가의 예약')을 취소합니다.",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.9,
        fallback_required: false,
        action: {
          type: "DELETE_RESERVATIONS_BATCH",
          payload: {},
        },
      },
      "내일 예약 취소해줘",
      tomorrowLookup,
    );

    expect(enriched.action?.type).toBe("DELETE_RESERVATION");
    expect(enriched.action?.payload?.reservationId).toBe(55);
  });

  it("clears delete action when lookup has no matching creator", () => {
    const singleOtherLookup: AssistantToolResultEntry[] = [
      {
        callId: "1",
        toolId: "reservations_by_date_lookup",
        args: { date: "2026-07-06" },
        ok: true,
        message: "ok",
        data: {
          date: "2026-07-06",
          reservations: [
            {
              reservationId: 99,
              date: "2026-07-06",
              title: "사전전수 1일차",
              creatorName: "회원나",
            },
          ],
        },
      },
    ];

    const enriched = enrichAnalysisWithCancelIntent(
      {
        summary:
          "내일(7월 6일) 예약을 확인한 결과, '회원가' 님의 예약이 없어 취소할 항목이 없습니다.",
        detected_text: "",
        admin_action_required: true,
        recommended_action:
          "총 1건 예약 취소를 제안합니다. 아래 내용을 확인한 뒤 승인해주세요.",
        confidence: 0.9,
        fallback_required: false,
        action: {
          type: "DELETE_RESERVATION",
          payload: { reservationId: 99 },
        },
      },
      "내일 연습 하나씩 확인하고, 회원가가 예약자인 연습있으면 취소해줘",
      singleOtherLookup,
    );

    expect(enriched.admin_action_required).toBe(false);
    expect(enriched.recommended_action).toBe("");
    expect(enriched.action?.type).toBe("NONE");
  });
});
