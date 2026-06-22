import { describe, expect, it } from "vitest";
import {
  expandAssistantActions,
  expandAssistantActionsInAnalysis,
} from "./expand-assistant-actions";
import type { AssistantAction } from "../types/assistant-analysis.types";

describe("expandAssistantActions", () => {
  it("expands CREATE_RESERVATIONS_MULTI into CREATE_RESERVATION actions", () => {
    const actions: AssistantAction[] = [
      {
        type: "CREATE_RESERVATIONS_MULTI",
        payload: {
          reservations: [
            { date: "2026-07-05", title: "A" },
            { date: "2026-07-06", title: "B" },
          ],
        },
      },
    ];

    const expanded = expandAssistantActions(actions);
    expect(expanded).toHaveLength(2);
    expect(expanded[0]).toMatchObject({
      type: "CREATE_RESERVATION",
      payload: { date: "2026-07-05", title: "A" },
    });
    expect(expanded[1]).toMatchObject({
      type: "CREATE_RESERVATION",
      payload: { date: "2026-07-06", title: "B" },
    });
  });

  it("keeps non-multi actions unchanged", () => {
    const actions: AssistantAction[] = [
      { type: "CREATE_NOTICE", payload: { title: "공지" } },
    ];

    expect(expandAssistantActions(actions)).toEqual(actions);
  });

  it("splits RESERVATION_BATCH_CREATE dayTimes into separate batch actions", () => {
    const actions: AssistantAction[] = [
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [
            { day: "월", startTime: "18:00", endTime: "21:00" },
            { day: "화", startTime: "14:00", endTime: "18:00" },
          ],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "정기예약",
            reservationType: "REGULAR",
          },
        },
      },
    ];

    const expanded = expandAssistantActions(
      actions,
      [
        "월 와우풍물패 악반 18:00~21:00",
        "화 신소재·화학공학과 학회 신명화랑 14:00~18:00",
      ].join("\n"),
    );

    expect(expanded).toHaveLength(2);
    expect(expanded[0]).toMatchObject({
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
        duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
        batchReservationOption: {
          title: "와우풍물패 악반의 정기 연습",
          clubName: "와우풍물패 악반",
          reservationType: "REGULAR",
        },
      },
    });
    expect(expanded[1]).toMatchObject({
      payload: {
        dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
        batchReservationOption: {
          title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
          clubName: "신소재·화학공학과 학회 신명화랑",
        },
      },
    });
  });

  it("keeps multiple dayTimes together when they belong to the same club", () => {
    const actions: AssistantAction[] = [
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [
            { day: "월", startTime: "18:00", endTime: "21:00" },
            { day: "금", startTime: "18:00", endTime: "21:00" },
          ],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "정기예약",
            reservationType: "REGULAR",
          },
        },
      },
    ];

    const expanded = expandAssistantActions(
      actions,
      [
        "월 와우풍물패 악반 18:00~21:00",
        "금 와우풍물패 악반 18:00~21:00",
      ].join("\n"),
    );

    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toMatchObject({
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes: [
          { day: "월", startTime: "18:00", endTime: "21:00" },
          { day: "금", startTime: "18:00", endTime: "21:00" },
        ],
        batchReservationOption: {
          title: "와우풍물패 악반의 정기 연습",
          clubName: "와우풍물패 악반",
        },
      },
    });
  });

  it("parses club names from colon schedule text when splitting batch actions", () => {
    const actions: AssistantAction[] = [
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [
            { day: "화", startTime: "14:00", endTime: "18:00" },
            { day: "수", startTime: "17:00", endTime: "19:00" },
          ],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "정기예약",
            reservationType: "REGULAR",
          },
        },
      },
    ];

    const detectedText =
      "월: 와우풍물패 악반(18:00~21:00), 화: 신소재·화학공학과 학회 신명화랑(14:00~18:00), 수: 컴퓨터공학과 학회 산틀(17:00~19:00)";

    const expanded = expandAssistantActions(actions, detectedText);

    expect(expanded).toHaveLength(2);
    expect(expanded[0]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
      batchReservationOption: {
        title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
        clubName: "신소재·화학공학과 학회 신명화랑",
      },
    });
    expect(expanded[1]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
      batchReservationOption: {
        title: "컴퓨터공학과 학회 산틀의 정기 연습",
        clubName: "컴퓨터공학과 학회 산틀",
      },
    });
  });

  it("consolidates complementary batch actions into one per club", () => {
    const detectedText =
      "월: 와우풍물패 악반(18:00~21:00), 화: 신소재·화학공학과 학회 신명화랑(14:00~18:00), 수: 컴퓨터공학과 학회 산틀(17:00~19:00), 목: 국어교육과 학회 들녘(15:00~17:00), 금: 와우풍물패 악반(18:00~21:00)";

    const expanded = expandAssistantActions(
      [
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [
              { day: "월", startTime: "18:00", endTime: "21:00" },
              { day: "금", startTime: "18:00", endTime: "21:00" },
            ],
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
            batchReservationOption: {
              title: "와우풍물패 악반의 정기 연습",
              reservationType: "REGULAR",
              creatorId: 45,
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
            batchReservationOption: {
              title: "undefined 정기 예약 생성",
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
            batchReservationOption: {
              title: "undefined 정기 예약 생성",
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
            batchReservationOption: {
              title: "undefined 정기 예약 생성",
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            batchReservationOption: {
              title: "신명화랑의 정기 연습",
              reservationType: "REGULAR",
              clubName: "신명화랑",
              creatorId: 38,
            },
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            batchReservationOption: {
              title: "산틀의 정기 연습",
              reservationType: "REGULAR",
              clubName: "산틀",
              creatorId: 54,
            },
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            batchReservationOption: {
              title: "들녘의 정기 연습",
              reservationType: "REGULAR",
              clubName: "들녘",
              creatorId: 53,
            },
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          },
        },
      ] satisfies AssistantAction[],
      detectedText,
    );

    expect(expanded).toHaveLength(4);
    expect(expanded[0]?.payload).toMatchObject({
      dayTimes: [
        { day: "월", startTime: "18:00", endTime: "21:00" },
        { day: "금", startTime: "18:00", endTime: "21:00" },
      ],
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
        creatorId: 45,
      },
    });
    expect(expanded[1]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
      batchReservationOption: {
        clubName: "신명화랑",
        creatorId: 38,
        reservationType: "REGULAR",
      },
    });
    expect(expanded[2]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
      batchReservationOption: {
        clubName: "산틀",
        creatorId: 54,
      },
    });
    expect(expanded[3]?.payload).toMatchObject({
      dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
      batchReservationOption: {
        clubName: "들녘",
        creatorId: 53,
      },
    });
  });

  it("does not merge other clubs' weekdays into 악반 batch", () => {
    const detectedText = [
      "월: 와우풍물패 악반 (17:00-23:00)",
      "화: 신소재·화학공학과 학회 신명화랑 (17:00-23:00)",
      "수: 컴퓨터공학과 학회 산틀 (17:00-23:00)",
      "목: 국어교육과 학회 들녘 (17:00-23:00)",
      "금: 와우풍물패 악반 (17:00-23:00)",
    ].join("\n");

    const expanded = expandAssistantActions(
      [
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [
              { day: "월", startTime: "17:00", endTime: "22:00" },
              { day: "금", startTime: "17:00", endTime: "22:00" },
            ],
            duration: { startDate: "2026-09-01", endDate: "2026-12-12" },
            batchReservationOption: {
              title: "악반의 정기 연습",
              clubName: "악반",
              reservationType: "REGULAR",
              creatorId: 45,
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [{ day: "화", startTime: "17:00", endTime: "22:00" }],
            duration: { startDate: "2026-09-01", endDate: "2026-12-12" },
            batchReservationOption: {
              title: "신명화랑의 정기 연습",
              clubName: "신명화랑",
              reservationType: "REGULAR",
              creatorId: 38,
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [{ day: "수", startTime: "17:00", endTime: "22:00" }],
            duration: { startDate: "2026-09-01", endDate: "2026-12-12" },
            batchReservationOption: {
              title: "산틀의 정기 연습",
              clubName: "산틀",
              reservationType: "REGULAR",
              creatorId: 54,
            },
          },
        },
        {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [{ day: "목", startTime: "17:00", endTime: "22:00" }],
            duration: { startDate: "2026-09-01", endDate: "2026-12-12" },
            batchReservationOption: {
              title: "들녘의 정기 연습",
              clubName: "들녘",
              reservationType: "REGULAR",
              creatorId: 53,
            },
          },
        },
      ] satisfies AssistantAction[],
      detectedText,
    );

    expect(expanded).toHaveLength(4);
    expect(expanded[0]?.payload).toMatchObject({
      dayTimes: [
        { day: "월", startTime: "17:00", endTime: "22:00" },
        { day: "금", startTime: "17:00", endTime: "22:00" },
      ],
      batchReservationOption: { clubName: "악반", creatorId: 45 },
    });
    expect(expanded[1]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "17:00", endTime: "22:00" }],
      batchReservationOption: { clubName: "신명화랑", creatorId: 38 },
    });
    expect(expanded[2]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "22:00" }],
      batchReservationOption: { clubName: "산틀", creatorId: 54 },
    });
    expect(expanded[3]?.payload).toMatchObject({
      dayTimes: [{ day: "목", startTime: "17:00", endTime: "22:00" }],
      batchReservationOption: { clubName: "들녘", creatorId: 53 },
    });
  });

  it("expands analysis actions and syncs current action", () => {
    const expanded = expandAssistantActionsInAnalysis({
      summary: "",
      detected_text: "",
      admin_action_required: true,
      recommended_action: "",
      confidence: 1,
      fallback_required: false,
      actions: [
        {
          type: "CREATE_RESERVATIONS_MULTI",
          payload: {
            reservations: [{ title: "A" }, { title: "B" }],
          },
        },
      ],
    });

    expect(expanded.actions).toHaveLength(2);
    expect(expanded.action?.type).toBe("CREATE_RESERVATION");
    expect(expanded.action?.payload).toEqual({ title: "A" });
  });
});
