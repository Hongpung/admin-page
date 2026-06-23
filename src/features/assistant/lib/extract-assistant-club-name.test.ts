import { describe, expect, it } from "vitest";
import {
  extractBatchClubName,
  hasClubRegularReservationIntent,
  matchAssistantClubNameFromText,
} from "./extract-assistant-club-name";

describe("matchAssistantClubNameFromText", () => {
  it("등록 동아리 키워드를 찾는다", () => {
    expect(matchAssistantClubNameFromText("악반의 정규 예약을 잡아줘")).toBe("악반");
    expect(matchAssistantClubNameFromText("와우풍물패 악반 연습")).toBe("악반");
  });
});

describe("extractBatchClubName", () => {
  it("정규 예약 제목에서 동아리명을 추출한다", () => {
    expect(
      extractBatchClubName({
        batchReservationOption: {
          title: "악반의 정규 예약",
          reservationType: "REGULAR",
        },
      }),
    ).toBe("악반");
  });

  it("메시지에서 동아리명을 보완한다", () => {
    expect(
      extractBatchClubName(
        {
          batchReservationOption: {
            title: "정기연습",
            reservationType: "REGULAR",
          },
        },
        "산틀 정기 예약 추가해줘",
      ),
    ).toBe("산틀");
  });
});

describe("hasClubRegularReservationIntent", () => {
  it("정규 예약 문구를 감지한다", () => {
    expect(
      hasClubRegularReservationIntent(
        "오늘부터 이번달 마지막 날까지 악반의 정규 예약을 잡아줘",
      ),
    ).toBe(true);
  });
});
