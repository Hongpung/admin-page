import { describe, expect, it } from "vitest";
import {
  appendBatchAddDayTime,
  isBatchAddDirty,
  removeBatchAddDayTime,
  updateBatchAddDayTime,
} from "./batch-add-state";

describe("batch-add-state", () => {
  it("detects an untouched external batch form as clean", () => {
    expect(
      isBatchAddDirty({
        practiceTitle: "",
        dayTimes: [],
        duration: {},
        option: { title: "", reservationType: "EXTERNAL" },
        creatorName: "",
      }),
    ).toBe(false);
  });

  it("detects user-entered values as dirty", () => {
    expect(
      isBatchAddDirty({
        practiceTitle: "연습",
        dayTimes: [],
        duration: {},
        option: { title: "", reservationType: "EXTERNAL" },
        creatorName: "",
      }),
    ).toBe(true);
  });

  it("keeps day rows sorted by weekday order and updates/removes rows", () => {
    const sorted = appendBatchAddDayTime(
      appendBatchAddDayTime([], "금"),
      "월",
    );

    expect(sorted.map((row) => row.day)).toEqual(["월", "금"]);
    expect(updateBatchAddDayTime(sorted, 0, "startTime", "10:00")[0]).toMatchObject(
      {
        day: "월",
        startTime: "10:00",
      },
    );
    expect(removeBatchAddDayTime(sorted, 0).map((row) => row.day)).toEqual([
      "금",
    ]);
  });
});
