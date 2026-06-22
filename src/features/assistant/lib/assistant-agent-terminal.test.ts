import { describe, expect, it } from "vitest";
import { evaluateAssistantAgentPhase } from "./assistant-agent-terminal";
import type { AssistantAnalysis } from "../types/assistant-analysis.types";

const baseAnalysis = {
  summary: "이번 주 예약을 조회합니다.",
  detected_text: "",
  admin_action_required: false,
  recommended_action: "",
  confidence: 0.8,
  fallback_required: false,
  action: { type: "NONE" as const },
} satisfies AssistantAnalysis;

describe("evaluateAssistantAgentPhase", () => {
  it("continues when lookup is still pending", () => {
    const result = evaluateAssistantAgentPhase(baseAnalysis, {
      message: "이번주 예약 불러와줘",
      toolResults: [],
    });

    expect(result).toEqual({
      phase: "continue",
      reason: "lookup_incomplete",
    });
  });

  it("continues notice delete until notice list lookup exists", () => {
    const result = evaluateAssistantAgentPhase(
      {
        ...baseAnalysis,
        summary: "공지를 삭제하겠습니다.",
        action: { type: "DELETE_NOTICE", payload: {} },
      },
      {
        message: "공지 '연습 안내' 삭제해줘",
        toolResults: [],
      },
    );

    expect(result).toEqual({
      phase: "continue",
      reason: "notice_needs_lookup",
    });
  });

  it("continues banner update until banner list lookup exists", () => {
    const result = evaluateAssistantAgentPhase(
      {
        ...baseAnalysis,
        summary: "배너를 수정하겠습니다.",
        action: { type: "UPDATE_BANNER", payload: {} },
      },
      {
        message: '"홍풍" 배너 owner 수정해줘',
        toolResults: [],
      },
    );

    expect(result).toEqual({
      phase: "continue",
      reason: "banner_needs_lookup",
    });
  });

  it("terminates read flow when summary is materialized", () => {
    const result = evaluateAssistantAgentPhase(
      {
        ...baseAnalysis,
        summary: "2026-07-01~2026-07-07 예약 2건:\n- ...",
      },
      {
        message: "이번주 예약 불러와줘",
        toolResults: [
          {
            callId: "1",
            toolId: "reservations_by_week_lookup",
            args: { weekOffset: 0 },
            ok: true,
            message: "ok",
            data: {
              reservations: [{ reservationId: 1, date: "2026-07-01" }],
            },
          },
        ],
      },
    );

    expect(result).toEqual({
      phase: "terminal",
      reason: "read_complete",
    });
  });

  it("continues cancel flow until reservation lookup exists", () => {
    const result = evaluateAssistantAgentPhase(
      {
        ...baseAnalysis,
        summary: "예약을 취소하겠습니다.",
      },
      {
        message: "이번주 예약 전부 취소해줘",
        toolResults: [],
      },
    );

    expect(result).toEqual({
      phase: "continue",
      reason: "cancel_needs_lookup",
    });
  });
});
