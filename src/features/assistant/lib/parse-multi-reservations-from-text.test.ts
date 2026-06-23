import { describe, expect, it } from "vitest";
import { enrichAnalysisFromMessage } from "./enrich-analysis-from-message";
import {
  hasMultiReservationCreateIntent,
  parseMultiReservationsFromText,
} from "./parse-multi-reservations-from-text";
import type { AssistantToolResultEntry } from "./assistant-tool-loop";
import { inferPrefetchReadToolCalls } from "./infer-prefetch-read-tool-calls";

const MULTI_MESSAGE = `총 3건의 예약을 생성합니다.

내일(7/5) 12:00~13:00, 회원가, 일반연습
내일(7/5) 16:00~18:00, 회원나, 정기연습
내일(7/5) 19:00~22:00, 외부팀가, 장구모임 외부예약`;

const NATURAL_MULTI_MESSAGE =
  "회원나의 입대굿으로 내일 18시에 30분짜리 예약 추가해주고, 외부 예약으로 홍풍 대청소라는 이름의 예약을 21시부터 1시간 짜리로 잡아줘";

describe("parseMultiReservationsFromText", () => {
  it("parses multiple same-day reservation lines", () => {
    const slots = parseMultiReservationsFromText(MULTI_MESSAGE);

    expect(slots).toHaveLength(3);
    expect(slots[0]).toMatchObject({
      startTime: "12:00",
      endTime: "13:00",
      creatorName: "회원가",
      title: "일반연습",
      reservationType: "COMMON",
    });
    expect(slots[1]).toMatchObject({
      startTime: "16:00",
      endTime: "18:00",
      creatorName: "회원나",
      title: "정기연습",
      reservationType: "REGULAR",
    });
    expect(slots[2]).toMatchObject({
      startTime: "19:00",
      endTime: "22:00",
      creatorName: "외부팀가",
      title: "장구모임",
      reservationType: "EXTERNAL",
    });
  });

  it("detects multi reservation intent", () => {
    expect(hasMultiReservationCreateIntent(MULTI_MESSAGE)).toBe(true);
  });

  it("parses chained natural-language reservation requests", () => {
    const slots = parseMultiReservationsFromText(NATURAL_MULTI_MESSAGE);

    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({
      startTime: "18:00",
      endTime: "18:30",
      creatorName: "회원나",
      title: "회원나의 입대굿",
      reservationType: "REGULAR",
    });
    expect(slots[1]).toMatchObject({
      startTime: "21:00",
      endTime: "22:00",
      creatorName: "홍풍 대청소",
      title: "홍풍 대청소",
      reservationType: "EXTERNAL",
    });
  });
});

describe("multi reservation enrich pipeline", () => {
  const memberResults: AssistantToolResultEntry[] = [
    {
      callId: "members-search-1",
      ok: true,
      toolId: "members_search_lookup",
      args: { username: "회원가", page: 0, pageSize: 20 },
      message: "회원을 조회했습니다.",
      data: {
        members: [{ memberId: 101, name: "회원가" }],
      },
    },
    {
      callId: "members-search-2",
      ok: true,
      toolId: "members_search_lookup",
      args: { username: "회원나", page: 0, pageSize: 20 },
      message: "회원을 조회했습니다.",
      data: {
        members: [{ memberId: 202, name: "회원나" }],
      },
    },
  ];

  it("prefetches member lookup for each internal creator", () => {
    const calls = inferPrefetchReadToolCalls(MULTI_MESSAGE);
    expect(calls).toEqual(
      expect.arrayContaining([
        {
          toolId: "members_search_lookup",
          args: { page: 0, pageSize: 20, username: "회원가" },
        },
        {
          toolId: "members_search_lookup",
          args: { page: 0, pageSize: 20, username: "회원나" },
        },
      ]),
    );
  });

  it("prefetches only internal creators from chained natural-language requests", () => {
    const calls = inferPrefetchReadToolCalls(NATURAL_MULTI_MESSAGE);

    expect(calls).toEqual(
      expect.arrayContaining([
        {
          toolId: "members_search_lookup",
          args: { page: 0, pageSize: 20, username: "회원나" },
        },
      ]),
    );
    expect(calls).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolId: "members_search_lookup",
          args: expect.objectContaining({ username: "홍풍 대청소" }),
        }),
      ]),
    );
  });

  it("builds CREATE_RESERVATIONS_MULTI with resolved creator ids", () => {
    const enriched = enrichAnalysisFromMessage(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.9,
        fallback_required: false,
        action: { type: "CREATE_RESERVATION", payload: {} },
      },
      MULTI_MESSAGE,
      memberResults,
    );

    expect(enriched.actions?.length).toBe(3);
    expect(enriched.actions?.every((item) => item.type === "CREATE_RESERVATION")).toBe(
      true,
    );
    expect(enriched.actions?.map((item) => item.payload)).toEqual([
      expect.objectContaining({
        creatorId: 101,
        reservationType: "COMMON",
        title: "일반연습",
      }),
      expect.objectContaining({
        creatorId: 202,
        reservationType: "REGULAR",
        title: "정기연습",
      }),
      expect.objectContaining({
        externalCreatorName: "외부팀가",
        reservationType: "EXTERNAL",
        title: "장구모임",
      }),
    ]);
  });
});
