import { describe, expect, it } from "vitest";
import {
  extractReservationCreatorName,
  needsMemberLookupForMessage,
} from "./assistant-member-intent";
import {
  enrichAnalysisWithCreatorFromLookup,
} from "./build-creator-from-lookup";
import { resolveCreatorIdFromMemberLookup } from "./resolve-member-id-from-search";
import { inferPrefetchReadToolCalls } from "./infer-prefetch-read-tool-calls";
import type { AssistantToolResultEntry } from "./assistant-tool-loop";

describe("extractReservationCreatorName", () => {
  it("extracts creator name from reservation create phrasing", () => {
    expect(
      extractReservationCreatorName(
        "회원가를 예약자로 내일 오후 7시부터 한시간 예약",
      ),
    ).toBe("회원가");
    expect(extractReservationCreatorName("예약자 회원나 내일 7시 예약")).toBe(
      "회원나",
    );
  });

  it("ignores reserved tokens", () => {
    expect(extractReservationCreatorName("내일 오후 7시 예약")).toBeNull();
  });
});

describe("inferPrefetchReadToolCalls for reservation creator", () => {
  it("prefetches member search when creator name is mentioned", () => {
    expect(
      inferPrefetchReadToolCalls(
        "회원가를 예약자로 내일 오후 7시부터 한시간 예약",
      ),
    ).toEqual([
      {
        toolId: "members_search_lookup",
        args: { page: 0, pageSize: 20, username: "회원가" },
      },
    ]);
  });

  it("marks reservation creator messages as member lookup needed", () => {
    expect(
      needsMemberLookupForMessage(
        "회원가를 예약자로 내일 오후 7시부터 한시간 예약",
      ),
    ).toBe(true);
  });
});

describe("resolveCreatorIdFromMemberLookup", () => {
  const toolResults: AssistantToolResultEntry[] = [
    {
      callId: "1",
      toolId: "members_search_lookup",
      args: { username: "회원가", page: 0, pageSize: 20 },
      ok: true,
      message: "ok",
      data: {
        members: [
          { memberId: 42, name: "회원가", nickname: "회원가별칭" },
          { memberId: 99, name: "회원가대체", nickname: "다른회원" },
        ],
        totalCount: 2,
      },
    },
  ];

  it("resolves exact name match to memberId", () => {
    expect(resolveCreatorIdFromMemberLookup("회원가", toolResults)).toBe(42);
  });

  it("enriches create reservation action payload with creatorId", () => {
    const enriched = enrichAnalysisWithCreatorFromLookup(
      {
        summary: "",
        detected_text: "",
        admin_action_required: true,
        recommended_action: "",
        confidence: 0.7,
        fallback_required: false,
        action: {
          type: "CREATE_RESERVATION",
          payload: {
            date: "2026-07-05",
            startTime: "19:00",
            endTime: "20:00",
          },
        },
      },
      "회원가를 예약자로 내일 오후 7시 예약",
      toolResults,
    );

    expect(enriched.action?.payload?.creatorId).toBe(42);
    expect(enriched.action?.payload?.reservationType).toBe("REGULAR");
  });
});
