import { describe, expect, it } from "vitest";
import { enrichAnalysisFromMessage } from "./enrich-analysis-from-message";
import type { AssistantAnalysis } from "../types/assistant-analysis.types";
import type { AssistantToolResultEntry } from "./assistant-tool-loop";

const baseAnalysis = {
  summary: "",
  detected_text: "",
  admin_action_required: false,
  recommended_action: "",
  confidence: 0.5,
  fallback_required: false,
  action: { type: "UNKNOWN" as const },
} satisfies AssistantAnalysis;

const memberLookup: AssistantToolResultEntry[] = [
  {
    callId: "m1",
    toolId: "members_search_lookup",
    args: { username: "회원가", page: 0, pageSize: 20 },
    ok: true,
    message: "ok",
    data: {
      members: [{ memberId: 42, name: "회원가", nickname: null }],
    },
  },
];

const noticeLookup: AssistantToolResultEntry[] = [
  {
    callId: "n1",
    toolId: "notices_list_lookup",
    args: {},
    ok: true,
    message: "ok",
    data: {
      notices: [{ noticeId: 7, title: "연습 안내" }],
    },
  },
];

const bannerLookup: AssistantToolResultEntry[] = [
  {
    callId: "b1",
    toolId: "banners_list_lookup",
    args: {},
    ok: true,
    message: "ok",
    data: {
      banners: [{ bannerId: 9, owner: "홍풍" }],
    },
  },
];

const reservationLookup: AssistantToolResultEntry[] = [
  {
    callId: "r1",
    toolId: "reservations_by_week_lookup",
    args: { weekOffset: 0 },
    ok: true,
    message: "ok",
    data: {
      reservations: [{ reservationId: 101, date: "2026-07-07" }],
    },
  },
];

const clubLeadersLookup: AssistantToolResultEntry[] = [
  {
    callId: "c1",
    toolId: "club_leaders_lookup",
    args: {},
    ok: true,
    message: "ok",
    data: {
      leaders: [
        {
          clubId: 1,
          clubName: "와우풍물패 악반",
          leaderMemberId: 101,
          leaderName: "악반패짱",
        },
        {
          clubId: 2,
          clubName: "컴퓨터공학과 학회 산틀",
          leaderMemberId: 202,
          leaderName: "산틀패짱",
        },
      ],
    },
  },
];

describe("enrichAnalysisFromMessage", () => {
  it("prefills CREATE_RESERVATION with creator lookup", () => {
    const message =
      "내일 오후 1시부터 2시간짜리 연습을 회원가를 주최자로 생성해줘";
    const enriched = enrichAnalysisFromMessage(
      baseAnalysis,
      message,
      memberLookup,
    );

    expect(enriched.action?.type).toBe("CREATE_RESERVATION");
    expect(enriched.action?.payload).toMatchObject({
      title: "연습",
      startTime: "13:00",
      endTime: "15:00",
      creatorId: 42,
      reservationType: "REGULAR",
    });
  });

  it("prefills RESERVATION_BATCH_CREATE", () => {
    const message =
      "매주 월요일 7시부터 2시간 정기연습 회원가 주최자로 다음달까지";
    const enriched = enrichAnalysisFromMessage(
      baseAnalysis,
      message,
      memberLookup,
    );

    expect(enriched.action?.type).toBe("RESERVATION_BATCH_CREATE");
    expect(enriched.action?.payload).toMatchObject({
      dayTimes: [{ day: "월", startTime: "10:00", endTime: "12:00" }],
      batchReservationOption: {
        title: "정기연습",
        reservationType: "REGULAR",
        creatorId: 42,
      },
    });
    expect(
      (enriched.action?.payload?.duration as { endDate?: string })?.endDate,
    ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("fills creatorId for multiple image-derived batch actions from club leaders", () => {
    const analysis = {
      ...baseAnalysis,
      admin_action_required: true,
      action: {
        type: "RESERVATION_BATCH_CREATE" as const,
        payload: {
          dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "와우풍물패 악반의 정기 연습",
            reservationType: "REGULAR",
            clubName: "와우풍물패 악반",
          },
        },
      },
      actions: [
        {
          type: "RESERVATION_BATCH_CREATE" as const,
          payload: {
            dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
            batchReservationOption: {
              title: "와우풍물패 악반의 정기 연습",
              reservationType: "REGULAR",
              clubName: "와우풍물패 악반",
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE" as const,
          payload: {
            dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
            batchReservationOption: {
              title: "컴퓨터공학과 학회 산틀의 정기 연습",
              reservationType: "REGULAR",
              clubName: "컴퓨터공학과 학회 산틀",
            },
          },
        },
      ],
    } satisfies AssistantAnalysis;

    const enriched = enrichAnalysisFromMessage(
      analysis,
      "첨부 이미지대로 방학기간 동안 예약들을 추가해줘. 예약자는 각 동아리 패짱으로 해줘",
      clubLeadersLookup,
    );

    expect(enriched.actions?.[0]?.payload?.batchReservationOption).toMatchObject({
      creatorId: 101,
    });
    expect(enriched.actions?.[1]?.payload?.batchReservationOption).toMatchObject({
      creatorId: 202,
    });
  });

  it("splits a merged image-derived batch action before club leader enrichment", () => {
    const analysis = {
      ...baseAnalysis,
      detected_text: [
        "월 와우풍물패 악반 18:00~21:00",
        "수 컴퓨터공학과 학회 산틀 17:00~19:00",
      ].join("\n"),
      admin_action_required: true,
      action: {
        type: "RESERVATION_BATCH_CREATE" as const,
        payload: {
          dayTimes: [
            { day: "월", startTime: "18:00", endTime: "21:00" },
            { day: "수", startTime: "17:00", endTime: "19:00" },
          ],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "정기예약",
            reservationType: "REGULAR",
          },
        },
      },
    } satisfies AssistantAnalysis;

    const enriched = enrichAnalysisFromMessage(
      analysis,
      "첨부 이미지대로 방학기간 동안 예약들을 추가해줘. 예약자는 각 동아리 패짱으로 해줘",
      clubLeadersLookup,
    );

    expect(enriched.actions).toHaveLength(2);
    expect(enriched.actions?.[0]?.payload).toMatchObject({
      dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
        clubName: "와우풍물패 악반",
        creatorId: 101,
      },
    });
    expect(enriched.actions?.[1]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
      batchReservationOption: {
        title: "컴퓨터공학과 학회 산틀의 정기 연습",
        clubName: "컴퓨터공학과 학회 산틀",
        creatorId: 202,
      },
    });
  });

  it("builds DELETE_RESERVATION from cancel lookup", () => {
    const enriched = enrichAnalysisFromMessage(
      baseAnalysis,
      "이번주 예약 취소해줘",
      reservationLookup,
    );

    expect(enriched.action?.type).toBe("DELETE_RESERVATION");
    expect(enriched.action?.payload?.reservationId).toBe(101);
  });

  it("prefills CREATE_NOTICE", () => {
    const message =
      "공지 등록해줘. 제목은 '연습 안내' 내용은 내일 정기연습이 있습니다. 전체 알림 발송해줘";
    const enriched = enrichAnalysisFromMessage(baseAnalysis, message, []);

    expect(enriched.action?.type).toBe("CREATE_NOTICE");
    expect(enriched.action?.payload).toMatchObject({
      title: "연습 안내",
      content: "내일 정기연습이 있습니다",
      noticeAll: true,
    });
  });

  it("resolves UPDATE_NOTICE from lookup", () => {
    const message = "공지 '연습 안내' 제목을 '새 연습 안내'로 바꿔줘";
    const enriched = enrichAnalysisFromMessage(
      baseAnalysis,
      message,
      noticeLookup,
    );

    expect(enriched.action?.type).toBe("UPDATE_NOTICE");
    expect(enriched.action?.payload).toMatchObject({
      noticeId: 7,
      title: "새 연습 안내",
    });
  });

  it("resolves DELETE_NOTICE from lookup", () => {
    const enriched = enrichAnalysisFromMessage(
      baseAnalysis,
      "공지 '연습 안내' 삭제해줘",
      noticeLookup,
    );

    expect(enriched.action?.type).toBe("DELETE_NOTICE");
    expect(enriched.action?.payload?.noticeId).toBe(7);
  });

  it("prefills CREATE_BANNER", () => {
    const message =
      "홍풍 배너를 2026-07-01부터 2026-07-31까지 등록해줘. 이미지 https://cdn.example.com/banner.jpg";
    const enriched = enrichAnalysisFromMessage(baseAnalysis, message, []);

    expect(enriched.action?.type).toBe("CREATE_BANNER");
    expect(enriched.action?.payload).toMatchObject({
      owner: "홍풍",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      bannerImgUrl: "https://cdn.example.com/banner.jpg",
    });
  });

  it("resolves UPDATE_BANNER from lookup", () => {
    const enriched = enrichAnalysisFromMessage(
      baseAnalysis,
      '"홍풍" 배너 owner를 홍풍어드민으로 수정해줘',
      bannerLookup,
    );

    expect(enriched.action?.type).toBe("UPDATE_BANNER");
    expect(enriched.action?.payload?.bannerId).toBe(9);
  });

  it("resolves DELETE_BANNER from lookup", () => {
    const enriched = enrichAnalysisFromMessage(
      baseAnalysis,
      '"홍풍" 배너 삭제해줘',
      bannerLookup,
    );

    expect(enriched.action?.type).toBe("DELETE_BANNER");
    expect(enriched.action?.payload?.bannerId).toBe(9);
  });
});
