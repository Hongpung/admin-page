import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  enrichImageExtractionWithFallbackActions,
  extractScheduleFromImage,
  imageExtractionToAnalysis,
  type ImageExtractionResult,
} from "@admin/features/assistant/lib/google-genai";

const D503_SUMMER_SCHEDULE_MESSAGE =
  "첨부한 이미지와 이대로 예약들을 추가해야돼. 방학기간은 2026-07-20부터 2026년 8월 마지막 날까지야. 예약자는 각 동아리 패짱으로 해줘.";

const D503_IMAGE_PATH =
  process.env.ASSISTANT_IMAGE_TEST_PATH ??
  "public/test/image-a7408170-f055-4a52-b565-a50e391dc9bf.png";

const d503ImageExtraction = {
  detected_text: [
    "2026년 하계 방학 D503 사용 시간표",
    "월 와우풍물패 악반 18:00~21:00",
    "화 신소재·화학공학과 학회 신명화랑 14:00~18:00",
    "수 컴퓨터공학과 학회 산틀 17:00~19:00",
    "목 국어교육과 학회 들녘 15:00~17:00",
    "금 와우풍물패 악반 18:00~21:00",
    "토, 일 홍풍 어플로 예약 후 사용",
  ].join("\n"),
  confidence: 0.95,
  fallback_required: false,
  actions: [
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
    {
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
        duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
        batchReservationOption: {
          title: "국어교육과 학회 들녘의 정기 연습",
          reservationType: "REGULAR",
          clubName: "국어교육과 학회 들녘",
        },
      },
    },
    {
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes: [{ day: "금", startTime: "18:00", endTime: "21:00" }],
        duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
        batchReservationOption: {
          title: "와우풍물패 악반의 정기 연습",
          reservationType: "REGULAR",
          clubName: "와우풍물패 악반",
        },
      },
    },
  ],
} satisfies ImageExtractionResult;

describe("D503 summer schedule image regression", () => {
  it("preserves the image-derived batch actions for the attached schedule", () => {
    const analysis = imageExtractionToAnalysis(d503ImageExtraction);

    expect(analysis.admin_action_required).toBe(true);
    expect(analysis.actions).toHaveLength(5);
    expect(analysis.actions?.map((action) => action.payload)).toEqual(
      d503ImageExtraction.actions?.map((action) => action.payload),
    );
  });

  it("recovers batch payloads when the model returns empty batch actions", () => {
    const recovered = enrichImageExtractionWithFallbackActions(
      {
        detected_text: [
          "2026년 하계 방학 D503 사용 시간표",
          "월: 와우풍물패 악반, 18:00~21:00",
          "화: 신소재·화학공학과 학회 신명화랑, 14:00~18:00",
          "수: 컴퓨터공학과 학회 산틀, 17:00~19:00",
          "목: 국어교육과 학회 들녘, 15:00~17:00",
          "금: 와우풍물패 악반, 18:00~21:00",
          "토,일: 홍풍 어플로 예약 후 사용",
        ].join("\n"),
        confidence: 0.9,
        fallback_required: false,
        actions: Array.from({ length: 5 }, () => ({
          type: "RESERVATION_BATCH_CREATE" as const,
          payload: {},
        })),
      },
      D503_SUMMER_SCHEDULE_MESSAGE,
    );

    expect(recovered.actions).toHaveLength(5);
    expect(recovered.actions?.[0]?.payload).toMatchObject({
      dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
        reservationType: "REGULAR",
        clubName: "와우풍물패 악반",
      },
    });
    expect(recovered.actions?.[4]?.payload).toMatchObject({
      dayTimes: [{ day: "금", startTime: "18:00", endTime: "21:00" }],
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
      },
    });
  });

  it("recovers batch payloads from flattened column OCR text", () => {
    const recovered = enrichImageExtractionWithFallbackActions(
      {
        detected_text: [
          "2026년 하계 방학 D503 사용 시간표",
          "요일 월 화 수 목 금 토, 일",
          "시간와우풍물패 악반 신소재·화학공학과 학회 신명화랑 컴퓨터공학과 학회 산틀 국어교육과 학회들녘 와우풍물패 악반 홍풍 어플로 예약 후 사용",
          "18:00~21:00 14:00~18:00 17:00~19:00 15:00~17:00 18:00~21:00",
          "[연습실 사용 규칙]",
          "1) 방학 중 연습실 사용 시간은 08:00~23:00입니다.",
        ].join("\n"),
        confidence: 0.98,
        fallback_required: false,
        actions: [
          { type: "RESERVATION_BATCH_CREATE" as const, status: "ready" as const },
          {
            type: "RESERVATION_BATCH_CREATE" as const,
            payload: {},
            status: "ready" as const,
          },
          {
            type: "RESERVATION_BATCH_CREATE" as const,
            payload: {},
            status: "ready" as const,
          },
          {
            type: "RESERVATION_BATCH_CREATE" as const,
            payload: {},
            status: "ready" as const,
          },
          {
            type: "RESERVATION_BATCH_CREATE" as const,
            payload: {},
            status: "ready" as const,
          },
        ],
      },
      "이미지 내용 대로 정기 예약을 추가해줘, 방학 기간은 2026 07 20 ~ 2026 08 31 까지야",
    );

    expect(recovered.actions).toHaveLength(5);
    expect(recovered.actions?.map((action) => action.payload)).toEqual([
      expect.objectContaining({
        dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
        batchReservationOption: expect.objectContaining({
          title: "와우풍물패 악반의 정기 연습",
        }),
      }),
      expect.objectContaining({
        dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
        batchReservationOption: expect.objectContaining({
          title: "신소재·화학공학과 학회 신명화랑의 정기 연습",
        }),
      }),
      expect.objectContaining({
        dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
        batchReservationOption: expect.objectContaining({
          title: "컴퓨터공학과 학회 산틀의 정기 연습",
        }),
      }),
      expect.objectContaining({
        dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
        batchReservationOption: expect.objectContaining({
          title: "국어교육과 학회 들녘의 정기 연습",
        }),
      }),
      expect.objectContaining({
        dayTimes: [{ day: "금", startTime: "18:00", endTime: "21:00" }],
        batchReservationOption: expect.objectContaining({
          title: "와우풍물패 악반의 정기 연습",
        }),
      }),
    ]);
  });

  it("recovers batch payloads from colon-parenthesis OCR text", () => {
    const recovered = enrichImageExtractionWithFallbackActions(
      {
        detected_text: [
          "2026년 하계 방학 D503 사용 시간표",
          "월: 와우풍물패 악반 (18:00~21:00)",
          "화: 신소재·화학공학과 학회 신명화랑 (14:00~18:00)",
          "수: 컴퓨터공학과 학회 산틀 (17:00~19:00)",
          "목:국어교육과 학회 들녘 (15:00~17:00)",
          "금: 와우풍물패 악반 (18:00~21:00)",
          "토, 일: 홍풍 어플로 예약 후 사용",
        ].join("\n"),
        confidence: 0.98,
        fallback_required: false,
        action: {
          type: "RESERVATION_BATCH_CREATE",
          payload: {
            dayTimes: [
              { day: "월", startTime: "18:00", endTime: "21:00" },
              { day: "금", startTime: "18:00", endTime: "21:00" },
            ],
            duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
            title:
              "와우풍물패 악반의 정기 연습_월, 금 18:00~21:00 (2026-07-20~2026-08-31) (batch-action: 1 / 4) broken.json",
          },
        },
      },
      D503_SUMMER_SCHEDULE_MESSAGE,
    );

    expect(recovered.actions).toHaveLength(5);
    expect(recovered.actions?.[0]?.payload).toMatchObject({
      dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
        clubName: "와우풍물패 악반",
      },
    });
    expect(recovered.actions?.[2]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
      batchReservationOption: {
        title: "컴퓨터공학과 학회 산틀의 정기 연습",
      },
    });
  });

  it("recovers batch payloads from sentence OCR text", () => {
    const recovered = enrichImageExtractionWithFallbackActions(
      {
        detected_text:
          "2026년 하계 방학 D503 사용 시간표. 요일: 월, 화, 수, 목, 금, 토,일. 시간 및 동아리: 월요일 와우풍물패 악반 18:00~21:00, 화요일 신소재·화학공학과 학회 신명화랑 14:00~18:00, 수요일 컴퓨터공학과 학회 산틀 17:00~19:00, 목요일 국어교육과 학회 들녘 15:00~17:00, 금요일 와우풍물패 악반 18:00~21:00. 토,일은 홍풍 어플로 예약 후 사용. 연습실 사용 규칙: 방학 중 사용 시간 08:00~23:00.",
        confidence: 0.98,
        fallback_required: false,
        actions: [
          { type: "RESERVATION_BATCH_CREATE" as const, status: "ready" as const },
          {
            type: "RESERVATION_BATCH_CREATE" as const,
            payload: {},
            status: "ready" as const,
          },
          {
            type: "RESERVATION_BATCH_CREATE" as const,
            payload: {},
            status: "ready" as const,
          },
          {
            type: "RESERVATION_BATCH_CREATE" as const,
            payload: {},
            status: "ready" as const,
          },
        ],
      },
      "이 내용 대로 정기 예약을 추가해줘, 방학 기간은 2026 07 20 ~ 2026 08 31 까지야",
    );

    expect(recovered.actions).toHaveLength(5);
    expect(recovered.actions?.[0]?.payload).toMatchObject({
      dayTimes: [{ day: "월", startTime: "18:00", endTime: "21:00" }],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
        reservationType: "REGULAR",
        clubName: "와우풍물패 악반",
      },
    });
    expect(recovered.actions?.[3]?.payload).toMatchObject({
      dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
      batchReservationOption: {
        title: "국어교육과 학회 들녘의 정기 연습",
      },
    });
  });

  const shouldRunLiveImageTest =
    process.env.RUN_ASSISTANT_IMAGE_MODEL_TEST === "1" &&
    Boolean(process.env.GOOGLE_CLOUD_KEY?.trim()) &&
    existsSync(D503_IMAGE_PATH);

  const liveImageIt = shouldRunLiveImageTest ? it : it.skip;

  liveImageIt(
    "extracts the attached D503 image with the configured image model",
    async () => {
      const result = await extractScheduleFromImage({
        message: D503_SUMMER_SCHEDULE_MESSAGE,
        image: {
          buffer: readFileSync(D503_IMAGE_PATH),
          mimeType: "image/png",
        },
      });

      expect(result.detected_text).toContain("D503");
      expect(result.actions?.filter((action) => action.type === "RESERVATION_BATCH_CREATE"))
        .toHaveLength(5);
      expect(result.actions?.[0]?.payload).toMatchObject({
        duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      });
    },
    60_000,
  );
});
