import "server-only";

import {
  createPartFromFunctionResponse,
  FunctionCallingConfigMode,
  Type,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/genai";
import { executeAssistantLookupTool } from "@admin/features/assistant/lib/execute-assistant-lookup-tool";
import {
  getAssistantLookupToolDefinition,
  validateAssistantLookupToolArgs,
} from "@admin/features/assistant/lib/assistant-lookup-tool-definitions";
import {
  ASSISTANT_MAX_OUTPUT_TOKENS,
  getAssistantGenAiClient,
  getAssistantModel,
  getAssistantThinkingConfig,
} from "@admin/features/assistant/lib/assistant-genai-client";
import { logAssistantDebug } from "@admin/features/assistant/lib/assistant-debug-log";
import {
  buildReadToolLoopUserPrompt,
  READ_TOOL_LOOP_MANDATORY_RETRY_USER_MESSAGE,
  READ_TOOL_LOOP_SYSTEM_INSTRUCTION,
} from "@admin/features/assistant/constants/assistant-prompts/read-tool-loop";
import type { AssistantLookupToolId } from "@admin/features/assistant/types/assistant-tool.types";
import { isMandatoryReadPending } from "@admin/features/assistant/lib/assistant-agent-terminal";

export const ASSISTANT_READ_TOOL_MAX_ITERATIONS = 5;

export type AssistantToolResultEntry = {
  callId: string;
  toolId: string;
  args: Record<string, unknown>;
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
};

export type AssistantReadToolLoopResult = {
  toolResults: AssistantToolResultEntry[];
  assistantText: string | null;
  aiCallsUsed: number;
};

function getReadToolFunctionCallingConfig() {
  return {
    mode: FunctionCallingConfigMode.VALIDATED,
  };
}

const READ_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "club_leaders_lookup",
    description:
      "동아리별 패짱(정기 연습 예약 creator) memberId를 조회합니다.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clubName: {
          type: Type.STRING,
          description: "특정 동아리만 조회할 때 이름(선택)",
        },
      },
    },
  },
  {
    name: "reservations_by_date_lookup",
    description: "특정 날짜(YYYY-MM-DD)의 예약 목록을 조회합니다.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: "조회 날짜 (YYYY-MM-DD)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "reservations_by_term_lookup",
    description: "시작일~종료일 사이 예약 목록을 조회합니다.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        startDate: {
          type: Type.STRING,
          description: "시작일 (YYYY-MM-DD)",
        },
        endDate: {
          type: Type.STRING,
          description: "종료일 (YYYY-MM-DD)",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "reservations_by_week_lookup",
    description:
      "주간(월~일) 예약 목록을 조회합니다. '이번 주', '다음 주' 요청에 사용하세요.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        weekOffset: {
          type: Type.NUMBER,
          description: "0=이번 주, 1=다음 주, -1=지난 주",
        },
      },
    },
  },
  {
    name: "notices_list_lookup",
    description: "등록된 공지 목록과 noticeId를 조회합니다.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "banners_list_lookup",
    description: "등록된 배너 목록과 bannerId를 조회합니다.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "members_search_lookup",
    description:
      "회원을 이름·동아리·역할로 검색하고 memberId를 조회합니다. 예약 creatorId 확인에 사용하세요.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        username: {
          type: Type.STRING,
          description: "이름으로 검색 (선택)",
        },
        clubId: {
          type: Type.NUMBER,
          description: "동아리 ID (선택)",
        },
        role: {
          type: Type.STRING,
          description: "역할 한국어 표기 (선택, 예: 패짱)",
        },
        page: {
          type: Type.NUMBER,
          description: "페이지 (0-based, 기본 0)",
        },
        pageSize: {
          type: Type.NUMBER,
          description: "페이지 크기 (20|40|80, 기본 20)",
        },
      },
    },
  },
];

function createToolCallId(name: string): string {
  return `${name}-${crypto.randomUUID()}`;
}

async function executeReadToolCall(
  token: string,
  toolId: string,
  args: Record<string, unknown>,
): Promise<Pick<AssistantToolResultEntry, "ok" | "message" | "data">> {
  const definition = getAssistantLookupToolDefinition(toolId);
  if (!definition) {
    return { ok: false, message: `지원하지 않는 조회 도구입니다: ${toolId}` };
  }

  const validated = validateAssistantLookupToolArgs(
    definition.id as AssistantLookupToolId,
    args,
  );
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  try {
    const result = await executeAssistantLookupTool(
      token,
      definition.id,
      validated.data,
    );
    return {
      ok: result.ok,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "조회 도구 실행 중 오류가 발생했습니다.",
    };
  }
}

function toFunctionResponsePart(
  callId: string,
  name: string,
  result: Pick<AssistantToolResultEntry, "ok" | "message" | "data">,
): Part {
  const payload = result.ok
    ? { output: { message: result.message, ...(result.data ?? {}) } }
    : { error: result.message };

  return createPartFromFunctionResponse(callId, name, payload);
}

/**
 * 조회 전용 read-tool 루프.
 * 프롬프트: `READ_TOOL_LOOP_SYSTEM_INSTRUCTION` + `buildReadToolLoopUserPrompt`.
 */
export async function runAssistantReadToolLoop(
  token: string,
  message: string,
  initialToolResults: AssistantToolResultEntry[] = [],
): Promise<AssistantReadToolLoopResult> {
  const userPrompt = buildReadToolLoopUserPrompt(message);
  const ai = getAssistantGenAiClient();
  const contents: Content[] = [
    {
      role: "user",
      parts: [{ text: userPrompt }],
    },
  ];

  const toolResults: AssistantToolResultEntry[] = [...initialToolResults];
  let aiCallsUsed = 0;
  let assistantText: string | null = null;

  logAssistantDebug("read-tool-loop:prompt", userPrompt);

  for (let iteration = 0; iteration < ASSISTANT_READ_TOOL_MAX_ITERATIONS; iteration += 1) {
    const thinkingConfig = getAssistantThinkingConfig();
    const response = await ai.models.generateContent({
      model: getAssistantModel(),
      contents,
      config: {
        systemInstruction: READ_TOOL_LOOP_SYSTEM_INSTRUCTION,
        maxOutputTokens: ASSISTANT_MAX_OUTPUT_TOKENS,
        ...(thinkingConfig ? { thinkingConfig } : {}),
        tools: [{ functionDeclarations: READ_TOOL_DECLARATIONS }],
        toolConfig: {
          functionCallingConfig: {
            ...getReadToolFunctionCallingConfig(),
          },
        },
      },
    });
    aiCallsUsed += 1;

    const functionCalls = response.functionCalls;
    logAssistantDebug(`read-tool-loop:response:${iteration + 1}`, {
      finishReason: response.candidates?.[0]?.finishReason ?? "unknown",
      usageMetadata: response.usageMetadata,
      text: response.text?.trim() || null,
      functionCalls,
    });
    const modelParts = response.candidates?.[0]?.content?.parts;
    if (modelParts && modelParts.length > 0) {
      contents.push({ role: "model", parts: modelParts });
    }

    if (!functionCalls || functionCalls.length === 0) {
      assistantText = response.text?.trim() || null;
      if (
        isMandatoryReadPending(message, toolResults) &&
        iteration < ASSISTANT_READ_TOOL_MAX_ITERATIONS - 1
      ) {
        contents.push({
          role: "user",
          parts: [
            {
              text: READ_TOOL_LOOP_MANDATORY_RETRY_USER_MESSAGE,
            },
          ],
        });
        continue;
      }
      break;
    }

    const responseParts = await Promise.all(
      functionCalls.map(async (call) => {
        const name = call.name?.trim() ?? "";
        const callId = call.id?.trim() || createToolCallId(name || "tool");
        const args = call.args ?? {};

        const result = await executeReadToolCall(token, name, args);
        logAssistantDebug("read-tool-loop:tool-result", {
          callId,
          toolId: name,
          args,
          result,
        });
        toolResults.push({
          callId,
          toolId: name,
          args,
          ...result,
        });

        return toFunctionResponsePart(callId, name, result);
      }),
    );

    contents.push({ role: "user", parts: responseParts });
  }

  return { toolResults, assistantText, aiCallsUsed };
}

import { needsNoticeLookupForMessage } from "@admin/features/assistant/lib/assistant-notice-intent";
import { needsReservationLookupForMessage } from "@admin/features/assistant/lib/assistant-reservation-intent";
import { needsMemberLookupForMessage } from "@admin/features/assistant/lib/assistant-member-intent";

export function shouldRunAssistantReadToolLoop(message: string): boolean {
  const normalized = message.replace(/\s+/g, "");
  if (!normalized) return false;
  if (needsReservationLookupForMessage(message)) return true;
  if (needsMemberLookupForMessage(message)) return true;
  if (needsNoticeLookupForMessage(message)) return true;
  return /(?:공지|배너|패짱|동아리|연습)/.test(normalized);
}
