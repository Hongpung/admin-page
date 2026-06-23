import { describe, expect, it } from "vitest";
import {
  extractDatedScheduleSlotsFromText,
  isCollapsedScheduleSummary,
  isDatedPracticeScheduleText,
} from "./extract-dated-schedule-slots";

const COLLAPSED = `홍익대학교 풍물패연합 사전전수 시간표. 7/6(월) ~ 7/11(토). 오금반(담당가, 담당나), 고깔소고춤(담당다), 설장구(담당라), 판굿 소고(담당나), 통북놀이(담당마), 쇠 통합반(담당바), 판굿 북(담당가), 판굿 장구(담당사), 판굿 모임. 각 교시별 시간: 1교시(11:00-13:00), 2교시(13:00-15:00), 3교시(15:00-17:00), 4교시(17:00-19:00), 5교시(19:00-21:00).`;

const MATRIX = `사전전수 시간표
7/6(월) | 7/7(화) | 7/8(수)
1교시(11:00-13:00) | | 설장구(담당라) | 설장구(담당라)
2교시(13:00-15:00) | 오금반(담당가, 담당나) | 판굿 소고(담당나) | 판굿 소고(담당나)`;

const MULTILINE = `사전전수 시간표
7/6(월)
- 13:00~15:00: 오금반 (담당가, 담당나)
- 15:00~17:00: 고깔소고춤 (담당다)
7/7(화)
- 11:00~13:00: 설장구 (담당라)
7/11(토)
- 11:00: 판굿 모임`;

const INLINE = `홍익대학교 풍물패연합 사전전수 시간표. 7/6(월): 13:00-15:00 오금반(담당가, 담당나), 15:00-19:00 고깔소고춤(담당다). 7/7(화): 11:00-13:00 설장구(담당라), 13:00-17:00 판굿 소고(담당나), 17:00-19:00 통북놀이(담당마). 7/8(수): 11:00-13:00 설장구(담당라), 13:00-15:00 판굿 소고(담당나), 15:00-17:00 쇠 통합반(담당바), 17:00-19:00 판굿 북(담당가). 7/9(목): 11:00-13:00 설장구(담당라), 13:00-17:00 쇠 통합반(담당바), 17:00-19:00 통북놀이(담당마). 7/10(금): 11:00-15:00 판굿 장구(담당사), 15:00-17:00 통북놀이(담당마), 17:00-19:00 판굿 북(담당가). 7/11(토): 11:00 판굿 모임. 그 외 시간은 자율 연습.`;

describe("extractDatedScheduleSlotsFromText", () => {
  it("parses multiline bullet schedule", () => {
    const slots = extractDatedScheduleSlotsFromText(
      "2026년 7월 6일부터 예약 추가",
      MULTILINE,
    );

    expect(slots).toEqual([
      {
        date: "2026-07-06",
        startTime: "13:00",
        endTime: "15:00",
        title: "오금반",
        creatorName: "담당가",
      },
      {
        date: "2026-07-06",
        startTime: "15:00",
        endTime: "17:00",
        title: "고깔소고춤",
        creatorName: "담당다",
      },
      {
        date: "2026-07-07",
        startTime: "11:00",
        endTime: "13:00",
        title: "설장구",
        creatorName: "담당라",
      },
    ]);
  });

  it("parses inline OCR schedule, splits long ranges, then merges adjacent same practice blocks", () => {
    const slots = extractDatedScheduleSlotsFromText(
      "2026년 7월 6일부터 7월 12일까지 예약 추가",
      INLINE,
    );

    expect(slots.length).toBe(15);
    expect(slots[0]).toEqual({
      date: "2026-07-06",
      startTime: "13:00",
      endTime: "15:00",
      title: "오금반",
      creatorName: "담당가",
    });
    expect(slots).toContainEqual({
      date: "2026-07-06",
      startTime: "15:00",
      endTime: "19:00",
      title: "고깔소고춤",
      creatorName: "담당다",
    });
    expect(slots).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "판굿 모임" }),
      ]),
    );
  });
});

describe("isDatedPracticeScheduleText", () => {
  it("detects dated headers and grid layout without event-name keywords", () => {
    expect(isDatedPracticeScheduleText(INLINE)).toBe(true);
    expect(isDatedPracticeScheduleText("동아리 요일 표")).toBe(false);
    expect(
      isDatedPracticeScheduleText(
        `7/6(월) | 7/7(화)
1교시(11:00-13:00) | 설장구(담당라) | 오금반(담당가)`,
      ),
    ).toBe(true);
  });

  it("detects canonical YYYY-MM-DD slot lines", () => {
    expect(
      isDatedPracticeScheduleText(
        "2026-07-06, 11:00-15:00, 오금반, 담당가 ; REGULAR",
      ),
    ).toBe(true);
  });
});

describe("canonical comma schedule parser", () => {
  it("parses canonical lines including 판굿 모임 without creator", () => {
    const detectedText = `2026-07-11, 11:00-21:00, 판굿 모임, 판굿 모임 ; EXTERNAL`;
    const slots = extractDatedScheduleSlotsFromText(
      "7월 6일부터 한 주",
      detectedText,
    );

    expect(slots).toEqual([
      {
        date: "2026-07-11",
        startTime: "11:00",
        endTime: "21:00",
        title: "판굿 모임",
        creatorName: "판굿 모임",
        kindHint: "EXTERNAL",
      },
    ]);
  });
});

describe("isCollapsedScheduleSummary", () => {
  it("detects summarized OCR without per-slot times", () => {
    expect(isCollapsedScheduleSummary(COLLAPSED)).toBe(true);
    expect(
      isCollapsedScheduleSummary(
        `연습 배치 시간표. 7/6(월) ~ 7/11(토). 오금반(담당가), 설장구(담당라). 각 교시별 시간: 1교시(11:00-13:00), 2교시(13:00-15:00).`,
      ),
    ).toBe(true);
    expect(extractDatedScheduleSlotsFromText("7월 6일부터 11일", COLLAPSED)).toEqual([]);
    expect(isCollapsedScheduleSummary(INLINE)).toBe(false);
  });
});

describe("matrix schedule parser", () => {
  it("parses grid rows with date headers and period rows", () => {
    const slots = extractDatedScheduleSlotsFromText(
      "2026년 7월 6일부터",
      MATRIX,
    );

    expect(slots).toContainEqual({
      date: "2026-07-07",
      startTime: "11:00",
      endTime: "13:00",
      title: "설장구",
      creatorName: "담당라",
    });
    expect(slots).toContainEqual({
      date: "2026-07-06",
      startTime: "13:00",
      endTime: "15:00",
      title: "오금반",
      creatorName: "담당가",
    });
  });
});
