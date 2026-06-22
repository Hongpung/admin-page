import { describe, expect, it } from "vitest";
import {
  buildPatchFromFormValues,
  buildPatchFromPath,
  getValueAtPath,
} from "./assistant-draft-patch";
import { buildAssistantInputFieldConfigs } from "./assistant-input-field-config";

describe("assistant-draft-patch", () => {
  it("reads nested payload values", () => {
    expect(
      getValueAtPath(
        { batchReservationOption: { title: "정기연습" } },
        "batchReservationOption.title",
      ),
    ).toBe("정기연습");
  });

  it("builds nested patch objects", () => {
    expect(buildPatchFromPath("duration.startDate", "2026-07-01")).toEqual({
      duration: { startDate: "2026-07-01" },
    });
  });

  it("merges multiple form entries", () => {
    expect(
      buildPatchFromFormValues([
        { path: "date", value: "2026-07-05" },
        { path: "creatorId", value: 12 },
      ]),
    ).toEqual({
      date: "2026-07-05",
      creatorId: 12,
    });
  });
});

describe("buildAssistantInputFieldConfigs", () => {
  it("expands notice update patch into editable fields", () => {
    const configs = buildAssistantInputFieldConfigs(
      [
        {
          path: "patch",
          label: "수정할 내용",
          message: "제목·본문",
          display: "수정할 내용",
        },
      ],
      "UPDATE_NOTICE",
    );

    expect(configs.map((item) => item.path)).toEqual([
      "title",
      "content",
      "noticeAll",
    ]);
  });
});
