import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@admin/features/assistant/lib/resolve-creator-fields-on-patch", () => ({
  resolveCreatorFieldsInPayload: vi.fn(async (_token, payload) => payload),
}));

vi.mock("@admin/features/assistant/lib/execute-assistant-lookup-tool", () => ({
  executeAssistantLookupTool: vi.fn(async (_token, toolId, args) => {
    if (toolId === "club_leaders_lookup") {
      return {
        ok: true,
        message: "ok",
        data: {
          leader: {
            clubId: 2,
            clubName: args.clubName ?? "악반",
            leaderMemberId: 45,
            leaderName: "김준혁",
            leaderNickname: "윤필",
          },
        },
      };
    }
    return { ok: false, message: "unsupported" };
  }),
}));

import {
  autoResolveQueuedActionGaps,
  inferActionResolutionToolCalls,
  mergeResolutionPayloadFromOutput,
} from "./auto-resolve-queued-action-gaps";
import type { QueuedAssistantAction } from "@admin/features/assistant/types/assistant-draft.types";

describe("inferActionResolutionToolCalls", () => {
  it("infers club_leaders_lookup for batch reservation missing creatorId", () => {
    const action: QueuedAssistantAction = {
      id: "action-1",
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes: [{ day: "월", startTime: "17:00", endTime: "20:00" }],
        duration: { startDate: "2026-07-07", endDate: "2026-07-31" },
        batchReservationOption: {
          title: "악반의 정기 연습",
          reservationType: "REGULAR",
          clubName: "악반",
        },
      },
      status: "needs_input",
      missingFields: ["batchReservationOption.creatorId"],
      missingFieldItems: [],
      attempts: 0,
    };

    expect(inferActionResolutionToolCalls(action)).toEqual([
      { toolId: "club_leaders_lookup", args: { clubName: "악반" } },
    ]);
  });

  it("infers club_leaders_lookup from practice title without explicit clubName", () => {
    const action: QueuedAssistantAction = {
      id: "action-2",
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes: [{ day: "월", startTime: "17:00", endTime: "21:00" }],
        duration: { startDate: "2026-07-07", endDate: "2026-07-31" },
        batchReservationOption: {
          title: "악반의 정기 연습",
          reservationType: "REGULAR",
        },
      },
      status: "needs_input",
      missingFields: ["batchReservationOption.creatorId"],
      missingFieldItems: [],
      attempts: 0,
    };

    expect(inferActionResolutionToolCalls(action)).toEqual([
      { toolId: "club_leaders_lookup", args: { clubName: "악반" } },
    ]);
  });
});

describe("mergeResolutionPayloadFromOutput", () => {
  it("ignores empty ready payload", () => {
    const action: QueuedAssistantAction = {
      id: "action-1",
      type: "RESERVATION_BATCH_CREATE",
      payload: { dayTimes: [] },
      status: "pending",
      missingFields: [],
      missingFieldItems: [],
      attempts: 0,
    };

    const merged = mergeResolutionPayloadFromOutput(action, {
      status: "ready",
      payload: {},
    });

    expect(merged.payload).toEqual({ dayTimes: [] });
  });
});

describe("autoResolveQueuedActionGaps", () => {
  it("fills batch creatorId from club leaders lookup", async () => {
    const action: QueuedAssistantAction = {
      id: "action-1",
      type: "RESERVATION_BATCH_CREATE",
      payload: {
        dayTimes: [{ day: "월", startTime: "17:00", endTime: "20:00" }],
        duration: { startDate: "2026-07-07", endDate: "2026-07-31" },
        batchReservationOption: {
          title: "악반의 정기 연습",
          reservationType: "REGULAR",
          clubName: "악반",
        },
      },
      status: "needs_input",
      missingFields: ["batchReservationOption.creatorId"],
      missingFieldItems: [],
      attempts: 0,
    };

    const result = await autoResolveQueuedActionGaps(
      "token",
      action,
      {
        userMessage: "",
        detectedText: "",
        toolResults: [],
        llmTurns: 0,
        startedAt: new Date().toISOString(),
      },
    );

    expect(result.resolved).toBe(true);
    expect(result.action.status).toBe("ready");
    expect(
      (result.action.payload as { batchReservationOption?: { creatorId?: number } })
        .batchReservationOption?.creatorId,
    ).toBe(45);
  });
});
