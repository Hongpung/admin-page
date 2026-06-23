import { describe, expect, it } from "vitest";
import { buildBatchActionsFromScheduleText } from "./build-batch-actions-from-schedule";
import type { ClubLeaderInfo } from "../types/club-leader.types";

const leaders: ClubLeaderInfo[] = [
  {
    clubId: 1,
    clubName: "와우풍물패 악반",
    leaderMemberId: 45,
    leaderName: "악반 패짱",
  },
  {
    clubId: 2,
    clubName: "신명화랑",
    leaderMemberId: 38,
    leaderName: "신명화랑 패짱",
  },
  {
    clubId: 3,
    clubName: "산틀",
    leaderMemberId: 54,
    leaderName: "산틀 패짱",
  },
  {
    clubId: 4,
    clubName: "들녘",
    leaderMemberId: 53,
    leaderName: "들녘 패짱",
  },
];

describe("buildBatchActionsFromScheduleText", () => {
  it("groups repeated clubs and enriches creatorId from leaders", () => {
    const message =
      "이 내용 대로 정기 예약을 추가해줘, 방학 기간은 2026 07 20 ~ 2026 08 31 까지야";
    const detectedText =
      "월: 와우풍물패 악반(18:00~21:00), 화: 신소재·화학공학과 학회 신명화랑(14:00~18:00), 수: 컴퓨터공학과 학회 산틀(17:00~19:00), 목: 국어교육과 학회 들녘(15:00~17:00), 금: 와우풍물패 악반(18:00~21:00)";

    const actions = buildBatchActionsFromScheduleText(
      message,
      detectedText,
      leaders,
    );

    expect(actions).toHaveLength(4);
    expect(actions[0]?.payload).toMatchObject({
      dayTimes: [
        { day: "월", startTime: "18:00", endTime: "21:00" },
        { day: "금", startTime: "18:00", endTime: "21:00" },
      ],
      duration: { startDate: "2026-07-20", endDate: "2026-08-31" },
      batchReservationOption: {
        title: "와우풍물패 악반의 정기 연습",
        clubName: "와우풍물패 악반",
        reservationType: "REGULAR",
        creatorId: 45,
      },
    });
    expect(actions[1]?.payload).toMatchObject({
      dayTimes: [{ day: "화", startTime: "14:00", endTime: "18:00" }],
      batchReservationOption: {
        title: "신명화랑의 정기 연습",
        clubName: "신명화랑",
        creatorId: 38,
      },
    });
    expect(actions[2]?.payload).toMatchObject({
      dayTimes: [{ day: "수", startTime: "17:00", endTime: "19:00" }],
      batchReservationOption: {
        title: "산틀의 정기 연습",
        clubName: "산틀",
        creatorId: 54,
      },
    });
    expect(actions[3]?.payload).toMatchObject({
      dayTimes: [{ day: "목", startTime: "15:00", endTime: "17:00" }],
      batchReservationOption: {
        title: "들녘의 정기 연습",
        clubName: "들녘",
        creatorId: 53,
      },
    });
  });

  it("returns empty actions when duration is missing", () => {
    const actions = buildBatchActionsFromScheduleText(
      "정기 예약 추가",
      "월: 와우풍물패 악반(18:00~21:00)",
      leaders,
    );

    expect(actions).toEqual([]);
  });
});
