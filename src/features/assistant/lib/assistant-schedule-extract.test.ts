import { describe, expect, it } from "vitest";
import {
  collectScheduleRowsFromDetectedText,
  extractScheduleDurationFromText,
  extractScheduleRowsFromDetectedText,
} from "./assistant-schedule-extract";

describe("assistant-schedule-extract", () => {
  it("parses inline colon schedule rows from comma-separated text", () => {
    const detectedText =
      "월: 와우풍물패 악반(18:00~21:00), 화: 신소재·화학공학과 학회 신명화랑(14:00~18:00), 수: 컴퓨터공학과 학회 산틀(17:00~19:00)";

    expect(extractScheduleRowsFromDetectedText(detectedText)).toEqual([
      {
        day: "월",
        clubName: "와우풍물패 악반",
        startTime: "18:00",
        endTime: "21:00",
      },
      {
        day: "화",
        clubName: "신소재·화학공학과 학회 신명화랑",
        startTime: "14:00",
        endTime: "18:00",
      },
      {
        day: "수",
        clubName: "컴퓨터공학과 학회 산틀",
        startTime: "17:00",
        endTime: "19:00",
      },
    ]);
  });

  it("extracts duration from message and detected text", () => {
    expect(
      extractScheduleDurationFromText(
        "방학 기간은 2026 07 20 ~ 2026 08 31 까지야",
      ),
    ).toEqual({
      startDate: "2026-07-20",
      endDate: "2026-08-31",
    });
  });

  it("collects rows from inline text before column fallback", () => {
    expect(
      collectScheduleRowsFromDetectedText(
        "월: 와우풍물패 악반(18:00~21:00), 금: 와우풍물패 악반(18:00~21:00)",
      ),
    ).toHaveLength(2);
  });
});
