import { describe, expect, it } from "vitest";
import {
  cancelCurrentQueuedAction,
  completeCurrentQueuedAction,
  createQueuedAction,
  evaluateDraftQueue,
  failCurrentQueuedAction,
  findCurrentQueuedAction,
  getQueueProgress,
  isDraftQueueComplete,
  isInsubstantialActionPatch,
  mergeIncomingActionsIntoDraft,
  mergePayload,
} from "./assistant-action-queue";
import { analyzeAssistantToolSchemaGaps } from "./format-assistant-missing-fields";
import type { AssistantAction } from "../types/assistant-analysis.types";

describe("assistant-action-queue", () => {
  it("merges incoming actions into a new queue", () => {
    const draft = mergeIncomingActionsIntoDraft(null, [
      { type: "CREATE_RESERVATION", payload: { date: "2026-07-05" } },
      { type: "CREATE_NOTICE", payload: { title: "공지" } },
    ] satisfies AssistantAction[]);

    expect(draft.queue).toHaveLength(2);
    expect(draft.queue[0]?.type).toBe("CREATE_RESERVATION");
    expect(draft.queue[1]?.type).toBe("CREATE_NOTICE");
  });

  it("patches only the current queue item", () => {
    const base = mergeIncomingActionsIntoDraft(null, [
      { type: "CREATE_RESERVATION", payload: {} },
      { type: "CREATE_NOTICE", payload: {} },
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(base, [
      { type: "CREATE_RESERVATION", payload: { title: "연습" } },
    ] satisfies AssistantAction[]);

    expect(merged.queue[0]?.payload).toEqual(
      expect.objectContaining({ title: "연습" }),
    );
    expect(merged.queue[1]?.payload).toEqual({});
  });

  it("normalizes polluted text-model batch payloads during merge", () => {
    const base = mergeIncomingActionsIntoDraft(null, [
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
            reservationType: "REGULAR",
            clubName: "신소재·화학공학과 학회 신명화랑",
          },
        },
      },
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(base, [
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          noticeAll: false,
          participationAvailable: false,
          reservationType: "REGULAR",
          title: "D503 하계 방학 정기 예약: 와우풍물패 악반 외 3팀 (2026-07-20~2026-08-31)",
        },
      },
    ] satisfies AssistantAction[]);

    expect(merged.queue[0]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: {
        title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
        reservationType: "REGULAR",
        clubName: "신소재·화학공학과 학회 신명화랑",
      },
    });
    expect(merged.queue[0]?.payload).not.toHaveProperty("noticeAll");
    expect(merged.queue[0]?.payload).not.toHaveProperty("participationAvailable");
    expect(merged.queue[0]?.payload).not.toHaveProperty("title");
  });

  it("does not append repeated empty placeholder actions to an active queue", () => {
    const base = mergeIncomingActionsIntoDraft(null, [
      {
        type: "RESERVATION_BATCH_CREATE",
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
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(base, [
      { type: "RESERVATION_BATCH_CREATE", payload: {} },
      { type: "RESERVATION_BATCH_CREATE", payload: {} },
      { type: "RESERVATION_BATCH_CREATE", payload: {} },
    ] satisfies AssistantAction[]);

    expect(merged.queue).toHaveLength(1);
    expect(merged.queue[0]?.payload).toMatchObject({
      dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
    });
  });

  it("updates actions by id without appending duplicates", () => {
    const base = mergeIncomingActionsIntoDraft(null, [
      {
        type: "RESERVATION_BATCH_CREATE",
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
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "신명화랑",
            reservationType: "REGULAR",
            clubName: "신명화랑",
          },
        },
      },
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(base, [
      {
        id: base.queue[0]!.id,
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          batchReservationOption: { creatorId: 101 },
        },
      },
      {
        id: base.queue[1]!.id,
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          batchReservationOption: { creatorId: 102 },
        },
      },
    ] satisfies AssistantAction[]);

    expect(merged.queue).toHaveLength(2);
    expect(merged.queue[0]?.payload.batchReservationOption).toMatchObject({
      creatorId: 101,
    });
    expect(merged.queue[1]?.payload.batchReservationOption).toMatchObject({
      creatorId: 102,
    });
  });

  it("merges batch creator patches by club name without action id", () => {
    const base = mergeIncomingActionsIntoDraft(null, [
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
          duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
          batchReservationOption: {
            title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
            reservationType: "REGULAR",
            clubName: "신소재·화학공학과 학회 신명화랑",
          },
        },
      },
      {
        type: "RESERVATION_BATCH_CREATE",
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
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(base, [
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          batchReservationOption: {
            title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
            reservationType: "REGULAR",
            clubName: "신소재·화학공학과 학회 신명화랑",
            creatorId: 38,
          },
        },
      },
      {
        type: "RESERVATION_BATCH_CREATE",
        payload: {
          batchReservationOption: {
            title: "컴퓨터공학과 학회 산틀의 정기 연습",
            reservationType: "REGULAR",
            clubName: "컴퓨터공학과 학회 산틀",
            creatorId: 54,
          },
        },
      },
    ] satisfies AssistantAction[]);

    expect(merged.queue).toHaveLength(2);
    expect(merged.queue[0]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: { creatorId: 38 },
    });
    expect(merged.queue[1]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: { creatorId: 54 },
    });
  });

  it("merges day-only and club-only batch actions by detected schedule text", () => {
    const detectedText =
      "화: 신소재·화학공학과 학회 신명화랑(14:00~18:00), 수: 컴퓨터공학과 학회 산틀(17:00~19:00)";

    const base = mergeIncomingActionsIntoDraft(null, [
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
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(
      base,
      [
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
      ] satisfies AssistantAction[],
      detectedText,
    );

    expect(merged.queue).toHaveLength(2);
    expect(merged.queue[0]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
      batchReservationOption: {
        creatorId: 38,
        reservationType: "REGULAR",
      },
    });
    expect(merged.queue[1]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
      batchReservationOption: {
        creatorId: 54,
      },
    });
  });

  it("does not merge 신명화랑·산틀·들녘 slots into 악반 batch by weekday overlap", () => {
    const detectedText = [
      "월: 와우풍물패 악반 (17:00-23:00)",
      "화: 신소재·화학공학과 학회 신명화랑 (17:00-23:00)",
      "수: 컴퓨터공학과 학회 산틀 (17:00-23:00)",
      "목: 국어교육과 학회 들녘 (17:00-23:00)",
      "금: 와우풍물패 악반 (17:00-23:00)",
    ].join("\n");

    const base = mergeIncomingActionsIntoDraft(null, [
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
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(
      base,
      [
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

    expect(merged.queue).toHaveLength(4);
    expect(merged.queue[0]?.payload).toMatchObject({
      dayTimes: [
        { day: "월", startTime: "17:00", endTime: "22:00" },
        { day: "금", startTime: "17:00", endTime: "22:00" },
      ],
      batchReservationOption: { creatorId: 45 },
    });
    expect(merged.queue[1]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "17:00", endTime: "22:00" }],
      batchReservationOption: { creatorId: 38 },
    });
    expect(merged.queue[2]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "22:00" }],
      batchReservationOption: { creatorId: 54 },
    });
    expect(merged.queue[3]?.payload).toMatchObject({
      dayTimes: [{ day: "목", startTime: "17:00", endTime: "22:00" }],
      batchReservationOption: { creatorId: 53 },
    });
  });

  it("completes current action and advances to the next item", () => {
    const draft = evaluateDraftQueue({
      queue: [
        {
          ...createQueuedAction("DELETE_RESERVATION", { reservationId: 10 }),
          status: "ready",
          missingFields: [],
          missingFieldItems: [],
        },
        createQueuedAction("CREATE_NOTICE", { title: "공지", content: "본문" }),
      ],
      revision: 1,
      updatedAt: new Date().toISOString(),
    });

    const completed = completeCurrentQueuedAction(draft);
    const current = findCurrentQueuedAction(completed.queue);

    expect(completed.queue[0]?.status).toBe("completed");
    expect(current?.type).toBe("CREATE_NOTICE");
  });

  it("cancels current action and moves to the next item", () => {
    const draft = evaluateDraftQueue({
      queue: [
        createQueuedAction("CREATE_RESERVATION", { title: "연습" }),
        createQueuedAction("CREATE_NOTICE", { title: "공지", content: "본문" }),
      ],
      revision: 1,
      updatedAt: new Date().toISOString(),
    });

    const cancelled = cancelCurrentQueuedAction(draft);
    const current = findCurrentQueuedAction(cancelled.queue);

    expect(cancelled.queue[0]?.status).toBe("cancelled");
    expect(current?.type).toBe("CREATE_NOTICE");
  });

  it("treats failed actions as terminal so the queue can complete", () => {
    const draft = evaluateDraftQueue({
      queue: [
        {
          ...createQueuedAction("CREATE_RESERVATION", { title: "완료" }),
          status: "completed",
        },
        {
          ...createQueuedAction("CREATE_NOTICE", { title: "공지", content: "본문" }),
          status: "ready",
          missingFields: [],
          missingFieldItems: [],
        },
      ],
      revision: 1,
      updatedAt: new Date().toISOString(),
    });

    const failed = failCurrentQueuedAction(draft, "공지 생성에 실패했습니다.");

    expect(failed.queue[1]?.status).toBe("failed");
    expect(findCurrentQueuedAction(failed.queue)).toBeNull();
    expect(isDraftQueueComplete(failed)).toBe(true);
  });

  it("counts queue progress using only active actions", () => {
    const draft = evaluateDraftQueue({
      queue: [
        {
          ...createQueuedAction("CREATE_RESERVATION", { title: "완료" }),
          status: "completed",
        },
        {
          ...createQueuedAction("CREATE_NOTICE", { title: "취소" }),
          status: "cancelled",
        },
        createQueuedAction("RESERVATION_BATCH_CREATE", {
          dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
        }),
        createQueuedAction("RESERVATION_BATCH_CREATE", {
          dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
        }),
      ],
      revision: 1,
      updatedAt: new Date().toISOString(),
    });

    expect(getQueueProgress(draft.queue)).toEqual({
      index: 1,
      total: 2,
      pending: 2,
    });
  });

  it("merges nested payloads", () => {
    expect(
      mergePayload(
        { batchReservationOption: { title: "정기" } },
        { batchReservationOption: { reservationType: "REGULAR" } },
      ),
    ).toEqual({
      batchReservationOption: {
        title: "정기",
        reservationType: "REGULAR",
      },
    });
  });

  it("reports batch option missing fields with nested paths", () => {
    const gaps = analyzeAssistantToolSchemaGaps("reservation_batch_create", {
      dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
        reservationType: "REGULAR",
        clubName: "와우풍물패 악반",
      },
    });

    expect(gaps.map((gap) => gap.path)).toEqual([
      "batchReservationOption.creatorName",
    ]);
  });

  it("treats endTime-only CREATE_RESERVATION patches as insubstantial", () => {
    expect(
      isInsubstantialActionPatch("CREATE_RESERVATION", { endTime: "17:00" }),
    ).toBe(true);
    expect(
      isInsubstantialActionPatch("CREATE_RESERVATION", {
        date: "2026-07-06",
        startTime: "13:00",
        endTime: "15:00",
      }),
    ).toBe(false);
  });

  it("does not append insubstantial patches as new queue items", () => {
    const base = mergeIncomingActionsIntoDraft(null, [
      {
        type: "CREATE_RESERVATION",
        payload: {
          date: "2026-07-06",
          startTime: "13:00",
          title: "오금반 연습",
        },
      },
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(base, [
      { type: "CREATE_RESERVATION", payload: { endTime: "15:00" } },
      { type: "CREATE_RESERVATION", payload: { endTime: "17:00" } },
    ] satisfies AssistantAction[]);

    expect(merged.queue).toHaveLength(1);
    expect(merged.queue[0]?.payload).toEqual(
      expect.objectContaining({
        date: "2026-07-06",
        startTime: "13:00",
        title: "오금반 연습",
        endTime: "15:00",
      }),
    );
  });

  it("merges duplicate CREATE_RESERVATION slots by date, startTime, and title", () => {
    const base = mergeIncomingActionsIntoDraft(null, [
      {
        type: "CREATE_RESERVATION",
        payload: {
          date: "2026-07-06",
          startTime: "15:00",
          title: "고깔소고춤",
          endTime: "17:00",
          reservationType: "EXTERNAL",
        },
      },
    ] satisfies AssistantAction[]);

    const merged = mergeIncomingActionsIntoDraft(base, [
      {
        type: "CREATE_RESERVATION",
        payload: {
          date: "2026-07-06",
          startTime: "15:00",
          title: "고깔소고춤",
        },
      },
    ] satisfies AssistantAction[]);

    expect(merged.queue).toHaveLength(1);
    expect(merged.queue[0]?.payload).toEqual(
      expect.objectContaining({
        date: "2026-07-06",
        startTime: "15:00",
        title: "고깔소고춤",
        endTime: "17:00",
        reservationType: "EXTERNAL",
      }),
    );
  });
});
