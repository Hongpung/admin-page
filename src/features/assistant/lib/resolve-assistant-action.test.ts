import { describe, expect, it } from "vitest";
import { resolveAssistantAction } from "./resolve-assistant-action";
import type { AssistantAnalysis } from "../types/assistant-analysis.types";

function buildAnalysis(
  overrides: Partial<AssistantAnalysis> = {},
): AssistantAnalysis {
  return {
    summary: "요약",
    detected_text: "텍스트",
    admin_action_required: true,
    recommended_action: "아직 실행할 수 없습니다.",
    confidence: 0.3,
    fallback_required: true,
    action: {
      id: "action-1",
      type: "CREATE_RESERVATION",
      status: "needs_input",
      payload: { title: "오금반 연습" },
      missing_fields: ["date: 값을 입력해주세요"],
      missing_field_items: [
        {
          path: "date",
          label: "예약 날짜",
          message: "값을 입력해주세요",
          display: "예약 날짜 [date]: 값을 입력해주세요",
        },
      ],
    },
    actions: [
      {
        id: "action-1",
        type: "CREATE_RESERVATION",
        status: "needs_input",
        payload: { title: "오금반 연습" },
        missing_fields: ["date: 값을 입력해주세요"],
        missing_field_items: [
          {
            path: "date",
            label: "예약 날짜",
            message: "값을 입력해주세요",
            display: "예약 날짜 [date]: 값을 입력해주세요",
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("resolveAssistantAction", () => {
  it("returns need_input even when fallback_required is true", () => {
    const state = resolveAssistantAction(buildAnalysis());

    expect(state.kind).toBe("need_input");
    if (state.kind === "need_input") {
      expect(state.actionId).toBe("action-1");
      expect(state.fields.length).toBeGreaterThan(0);
    }
  });

  it("returns manual when fallback_required and no input gap", () => {
    const state = resolveAssistantAction(
      buildAnalysis({
        action: { type: "UNKNOWN" },
        actions: [{ type: "UNKNOWN" }],
      }),
    );

    expect(state.kind).toBe("manual");
  });
});
