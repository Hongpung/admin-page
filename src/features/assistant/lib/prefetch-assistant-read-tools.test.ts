import { describe, expect, it } from "vitest";
import { inferPrefetchReadToolCalls } from "./infer-prefetch-read-tool-calls";
import { buildCancelActionFromLookup } from "./build-cancel-action-from-lookup";
import type { AssistantToolResultEntry } from "./assistant-tool-loop";

describe("inferPrefetchReadToolCalls", () => {
  it("detects this-week reservation read requests", () => {
    const result = inferPrefetchReadToolCalls("이번주 예약을 모두 가져와줄래?");
    expect(result).toEqual([
      { toolId: "reservations_by_week_lookup", args: { weekOffset: 0 } },
    ]);
  });

  it("detects this-week reservation cancel requests", () => {
    const result = inferPrefetchReadToolCalls("이번주 예약 전부 취소해줘");
    expect(result).toEqual([
      { toolId: "reservations_by_week_lookup", args: { weekOffset: 0 } },
    ]);
  });

  it("detects explicit month reservation cancel requests", () => {
    const result = inferPrefetchReadToolCalls(
      "2026년 8월 예정된 예약들을 전부 취소해줘",
    );

    expect(result).toEqual([
      {
        toolId: "reservations_by_term_lookup",
        args: { startDate: "2026-08-01", endDate: "2026-08-31" },
      },
    ]);
  });

  it("detects multi-month cancel without the word 예약", () => {
    const result = inferPrefetchReadToolCalls("9월 10월 11월 12월 다");

    expect(result).toEqual([
      {
        toolId: "reservations_by_term_lookup",
        args: { startDate: "2026-09-01", endDate: "2026-12-31" },
      },
    ]);
  });

  it("detects multi-month cancel from short follow-up message", () => {
    const result = inferPrefetchReadToolCalls(
      "2026년 9월, 10월, 11월, 12월의 예약을 모두 취소",
    );

    expect(result).toEqual([
      {
        toolId: "reservations_by_term_lookup",
        args: { startDate: "2026-09-01", endDate: "2026-12-31" },
      },
    ]);
  });

  it("detects tomorrow reservation read requests", () => {
    const result = inferPrefetchReadToolCalls("내일 예약을 불러와줘");
    expect(result).toEqual([
      {
        toolId: "reservations_by_date_lookup",
        args: { date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
      },
    ]);
  });

  it("prefetches club leaders for regular practice creation requests", () => {
    expect(inferPrefetchReadToolCalls("이번주 정기연습 예약해줘")).toEqual([
      { toolId: "club_leaders_lookup", args: {} },
    ]);
  });

  it("prefetches club leaders for club batch reservation creator mapping", () => {
    const result = inferPrefetchReadToolCalls(
      "이미지 시간표대로 동아리 정기 예약을 만들고 각 동아리 패짱을 예약자로 해줘",
    );

    expect(result).toEqual([{ toolId: "club_leaders_lookup", args: {} }]);
  });

  it("prefetches club leaders for image-grounded batch reservation messages", () => {
    const result = inferPrefetchReadToolCalls(
      [
        "관리자 요청:",
        "이 내용 대로 정기 예약을 추가해줘, 방학 기간은 2026 07 20 ~ 2026 08 31 까지야",
        "",
        "첨부 이미지 구조화 후보(JSON):",
        JSON.stringify({
          actions: [
            {
              type: "RESERVATION_BATCH_CREATE",
              payload: {
                batchReservationOption: {
                  clubName: "와우풍물패 악반",
                },
              },
            },
          ],
        }),
      ].join("\n"),
    );

    expect(result).toEqual([{ toolId: "club_leaders_lookup", args: {} }]);
  });

  it("detects member search requests with username", () => {
    const result = inferPrefetchReadToolCalls("회원나 회원 찾아줘");
    expect(result).toEqual([
      {
        toolId: "members_search_lookup",
        args: { page: 0, pageSize: 20, username: "회원나" },
      },
    ]);
  });

  it("detects member list requests without username", () => {
    const result = inferPrefetchReadToolCalls("회원 목록 보여줘");
    expect(result).toEqual([
      {
        toolId: "members_search_lookup",
        args: { page: 0, pageSize: 20 },
      },
    ]);
  });
});

describe("buildCancelActionFromLookup", () => {
  it("builds batch delete action from week lookup results", () => {
    const toolResults: AssistantToolResultEntry[] = [
      {
        callId: "1",
        toolId: "reservations_by_week_lookup",
        args: { weekOffset: 0 },
        ok: true,
        message: "ok",
        data: {
          reservations: [
            { reservationId: 10, date: "2026-07-05", title: "A" },
            { reservationId: 11, date: "2026-07-06", title: "B" },
          ],
        },
      },
    ];

    expect(
      buildCancelActionFromLookup("이번주 예약 취소해줘", toolResults),
    ).toEqual({
      type: "DELETE_RESERVATIONS_BATCH",
      payload: { reservationIds: [10, 11] },
    });
  });
});
