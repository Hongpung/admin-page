import { describe, expect, it } from "vitest";
import {
  getReservationCreatorDisplayLabel,
  getReservationCreatorDisplayLines,
} from "./format-reservation-creator-display";

describe("getReservationCreatorDisplayLines", () => {
  it("이름과 닉네임을 각각 한 줄로 반환한다", () => {
    expect(getReservationCreatorDisplayLines("강윤호", "윤호")).toEqual([
      "강윤호",
      "윤호",
    ]);
  });

  it("닉네임이 없거나 이름과 같으면 이름만 반환한다", () => {
    expect(getReservationCreatorDisplayLines("강윤호", "")).toEqual(["강윤호"]);
    expect(getReservationCreatorDisplayLines("강윤호", "강윤호")).toEqual([
      "강윤호",
    ]);
  });

  it("이름이 없으면 닉네임만 반환한다", () => {
    expect(getReservationCreatorDisplayLines("", "윤호")).toEqual(["윤호"]);
  });
});

describe("getReservationCreatorDisplayLabel", () => {
  it("닉네임이 있으면 닉네임을 우선한다", () => {
    expect(getReservationCreatorDisplayLabel("강윤호", "윤호")).toBe("윤호");
  });

  it("닉네임이 없으면 이름을 반환한다", () => {
    expect(getReservationCreatorDisplayLabel("강윤호", "")).toBe("강윤호");
  });
});
