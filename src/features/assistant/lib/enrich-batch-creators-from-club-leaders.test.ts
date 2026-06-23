import { describe, expect, it } from "vitest";
import {
  enrichDraftWithClubLeaders,
} from "@admin/features/assistant/lib/enrich-batch-creators-from-club-leaders";
import { mergeIncomingActionsIntoDraft } from "@admin/features/assistant/lib/assistant-action-queue";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";

const clubLeadersLookup: AssistantToolResultEntry[] = [
  {
    callId: "c1",
    toolId: "club_leaders_lookup",
    args: {},
    ok: true,
    message: "ok",
    data: {
      leaders: [
        {
          clubId: 1,
          clubName: "와우풍물패 악반",
          leaderMemberId: 101,
          leaderName: "악반패짱",
        },
        {
          clubId: 2,
          clubName: "신소재·화학공학과 학회 신명화랑",
          leaderMemberId: 202,
          leaderName: "신명패짱",
        },
      ],
    },
  },
];

describe("enrichDraftWithClubLeaders", () => {
  it("fills creatorId for each queued batch action from club leaders lookup", () => {
    const draft = mergeIncomingActionsIntoDraft(null, [
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
    ]);

    const enriched = enrichDraftWithClubLeaders(draft, clubLeadersLookup);

    expect(enriched?.queue[0]?.payload.batchReservationOption).toMatchObject({
      creatorId: 101,
    });
    expect(enriched?.queue[1]?.payload.batchReservationOption).toMatchObject({
      creatorId: 202,
    });
  });
});
