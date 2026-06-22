import "server-only";

import {
  createPartFromFunctionResponse,
  FunctionCallingConfigMode,
  Type,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/genai";
import { z } from "zod";
import {
  autoResolveQueuedActionGaps,
  mergeResolutionPayloadFromOutput,
} from "@admin/features/assistant/lib/auto-resolve-queued-action-gaps";
import {
  evaluateQueuedAction,
  mergePayload,
} from "@admin/features/assistant/lib/assistant-action-queue";
import { executeAssistantLookupTool } from "@admin/features/assistant/lib/execute-assistant-lookup-tool";
import {
  getAssistantLookupToolDefinition,
  validateAssistantLookupToolArgs,
} from "@admin/features/assistant/lib/assistant-lookup-tool-definitions";
import {
  ACTION_RESOLUTION_FINAL_JSON_USER_MESSAGE,
  ACTION_RESOLUTION_INCOMPLETE_PAYLOAD_USER_MESSAGE,
  ACTION_RESOLUTION_INVALID_JSON_USER_MESSAGE,
  buildActionResolutionSystemInstruction,
  buildActionResolutionUserPrompt,
} from "@admin/features/assistant/constants/assistant-prompts/action-resolution";
import {
  ASSISTANT_MAX_OUTPUT_TOKENS,
  getAssistantGenAiClient,
  getAssistantResolutionModel,
  getAssistantThinkingConfig,
} from "@admin/features/assistant/lib/assistant-genai-client";
import { logAssistantDebug } from "@admin/features/assistant/lib/assistant-debug-log";
import type { AssistantLookupToolId } from "@admin/features/assistant/types/assistant-tool.types";
import type {
  ActionResolutionSession,
  ActionResolutionToolResult,
  QueuedAssistantAction,
} from "@admin/features/assistant/types/assistant-draft.types";

export const ACTION_RESOLUTION_MAX_TURNS = 6;

const RESOLUTION_LOOKUP_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "members_search_lookup",
    description:
      "회원 이름·닉네임으로 memberId를 조회합니다. 예약자 확인에 필수입니다.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        username: {
          type: Type.STRING,
          description: "검색할 이름 또는 닉네임",
        },
        page: { type: Type.NUMBER },
        pageSize: { type: Type.NUMBER },
      },
      required: ["username"],
    },
  },
  {
    name: "club_leaders_lookup",
    description: "동아리 패짱(정기 예약 creator) memberId를 조회합니다.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clubName: { type: Type.STRING },
      },
    },
  },
];

function getResolutionAllowedFunctionNames(
  actionType: string,
): string[] | undefined {
  if (actionType === "CREATE_RESERVATION") {
    return ["members_search_lookup", "club_leaders_lookup"];
  }

  if (actionType === "RESERVATION_BATCH_CREATE") {
    return ["club_leaders_lookup"];
  }

  return undefined;
}

const CREATE_RESERVATION_PAYLOAD_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    date: { type: Type.STRING, description: "YYYY-MM-DD" },
    startTime: { type: Type.STRING, description: "HH:mm, 30분 단위" },
    endTime: { type: Type.STRING, description: "HH:mm, 30분 단위" },
    reservationType: {
      type: Type.STRING,
      enum: ["COMMON", "REGULAR", "EXTERNAL"],
    },
    participationAvailable: { type: Type.BOOLEAN },
    creatorId: { type: Type.NUMBER },
    externalCreatorName: { type: Type.STRING },
  },
  required: [
    "title",
    "date",
    "startTime",
    "endTime",
    "reservationType",
    "participationAvailable",
  ],
};

const RESERVATION_BATCH_CREATE_PAYLOAD_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    dayTimes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          startTime: { type: Type.STRING, description: "HH:mm" },
          endTime: { type: Type.STRING, description: "HH:mm" },
        },
        required: ["day", "startTime", "endTime"],
      },
    },
    duration: {
      type: Type.OBJECT,
      properties: {
        startDate: { type: Type.STRING, description: "YYYY-MM-DD" },
        endDate: { type: Type.STRING, description: "YYYY-MM-DD" },
      },
      required: ["startDate", "endDate"],
    },
    batchReservationOption: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        reservationType: {
          type: Type.STRING,
          enum: ["COMMON", "REGULAR", "EXTERNAL"],
        },
        creatorId: { type: Type.NUMBER },
        creatorName: { type: Type.STRING },
        clubName: { type: Type.STRING },
      },
      required: ["title", "reservationType"],
    },
  },
  required: ["dayTimes", "duration", "batchReservationOption"],
};

const resolutionOutputSchema = z.object({
  status: z.enum(["ready", "needs_human", "failed"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
});

export type ActionResolutionResult = {
  action: QueuedAssistantAction;
  aiCallsUsed: number;
  terminal: boolean;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createToolCallId(name: string): string {
  return `${name}-${crypto.randomUUID()}`;
}

async function executeResolutionToolCall(
  token: string,
  toolId: string,
  args: Record<string, unknown>
): Promise<Pick<ActionResolutionToolResult, "ok" | "message" | "data">> {
  const definition = getAssistantLookupToolDefinition(toolId);
  if (!definition) {
    return { ok: false, message: `지원하지 않는 조회 도구입니다: ${toolId}` };
  }

  const validated = validateAssistantLookupToolArgs(
    definition.id as AssistantLookupToolId,
    args
  );
  if (!validated.ok) {
    return { ok: false, message: validated.message };
  }

  try {
    const result = await executeAssistantLookupTool(
      token,
      definition.id,
      validated.data
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
  result: Pick<ActionResolutionToolResult, "ok" | "message" | "data">
): Part {
  const payload = result.ok
    ? { output: { message: result.message, ...(result.data ?? {}) } }
    : { error: result.message };

  return createPartFromFunctionResponse(callId, name, payload);
}

function extractResolutionJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

function parseResolutionOutput(
  raw: string
): z.infer<typeof resolutionOutputSchema> | null {
  try {
    const parsed = resolutionOutputSchema.safeParse(
      JSON.parse(extractResolutionJsonText(raw)),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function getResolutionPayloadJsonSchema(actionType: string) {
  if (actionType === "CREATE_RESERVATION") {
    return CREATE_RESERVATION_PAYLOAD_JSON_SCHEMA;
  }
  if (actionType === "RESERVATION_BATCH_CREATE") {
    return RESERVATION_BATCH_CREATE_PAYLOAD_JSON_SCHEMA;
  }
  return { type: Type.OBJECT };
}

function isMeaningfulResolutionOutput(
  output: z.infer<typeof resolutionOutputSchema>,
): boolean {
  if (output.status !== "ready") {
    return true;
  }

  return isPlainRecord(output.payload) && Object.keys(output.payload).length > 0;
}

function finalizeResolutionOutput(
  current: QueuedAssistantAction,
  output: z.infer<typeof resolutionOutputSchema>,
  aiCallsUsed: number,
): ActionResolutionResult | null {
  if (output.status === "failed") {
    return {
      action: stripResolutionSession({
        ...current,
        status: "failed",
        error: output.message?.trim() || "payload 정규화에 실패했습니다.",
        attempts: current.attempts + 1,
      }),
      aiCallsUsed,
      terminal: true,
    };
  }

  if (output.status === "needs_human") {
    const mergedPayload = isPlainRecord(output.payload)
      ? mergePayload(current.payload, output.payload)
      : current.payload;
    const evaluated = evaluateQueuedAction(
      stripResolutionSession({
        ...current,
        payload: mergedPayload,
        error: undefined,
      }),
    );
    return {
      action: {
        ...evaluated,
        error: output.message?.trim() || evaluated.error,
      },
      aiCallsUsed,
      terminal: true,
    };
  }

  if (output.status === "ready" && isPlainRecord(output.payload)) {
    const merged = mergeResolutionPayloadFromOutput(current, output);
    const evaluated = evaluateQueuedAction(
      stripResolutionSession({
        ...merged,
        error: undefined,
      }),
    );
    logAssistantDebug("action-resolution:done", {
      actionId: evaluated.id,
      status: evaluated.status,
      payload: evaluated.payload,
    });
    return {
      action: evaluated,
      aiCallsUsed,
      terminal:
        evaluated.status === "ready" || evaluated.status === "needs_input",
    };
  }

  return null;
}

function stripResolutionSession(
  action: QueuedAssistantAction,
): QueuedAssistantAction {
  const next = { ...action };
  delete next.resolutionSession;
  return next;
}

function attachResolutionSession(
  action: QueuedAssistantAction,
  session: ActionResolutionSession
): QueuedAssistantAction {
  return { ...action, resolutionSession: session };
}

export function shouldResolveQueuedAction(
  action: QueuedAssistantAction
): boolean {
  if (action.status === "ready" || action.status === "confirming") {
    return false;
  }
  if (
    action.status === "completed" ||
    action.status === "failed" ||
    action.status === "cancelled"
  ) {
    return false;
  }

  return (
    action.type === "CREATE_RESERVATION" ||
    action.type === "RESERVATION_BATCH_CREATE"
  );
}

/**
 * 큐 액션 1건 payload 정규화 루프.
 * 프롬프트: `buildActionResolutionSystemInstruction` + `buildActionResolutionUserPrompt`.
 */
export async function resolveQueuedActionPayload(
  token: string,
  action: QueuedAssistantAction,
  context: { userMessage: string; detectedText: string }
): Promise<ActionResolutionResult> {
  if (!shouldResolveQueuedAction(action)) {
    return {
      action: stripResolutionSession(action),
      aiCallsUsed: 0,
      terminal: true,
    };
  }

  const session: ActionResolutionSession = action.resolutionSession ?? {
    userMessage: context.userMessage,
    detectedText: context.detectedText,
    toolResults: [],
    llmTurns: 0,
    startedAt: new Date().toISOString(),
  };

  let current = attachResolutionSession(action, session);
  let aiCallsUsed = 0;
  const ai = getAssistantGenAiClient();
  const model = getAssistantResolutionModel();
  const thinkingConfig = getAssistantThinkingConfig();

  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          text: buildActionResolutionUserPrompt({
            userMessage: session.userMessage,
            detectedText: session.detectedText,
            action: {
              id: current.id,
              type: current.type,
              payload: isPlainRecord(current.payload) ? current.payload : {},
              missingFields: current.missingFields,
            },
            toolResults: session.toolResults,
          }),
        },
      ],
    },
  ];

  logAssistantDebug("action-resolution:start", {
    actionId: current.id,
    type: current.type,
    payload: current.payload,
    missingFields: current.missingFields,
  });

  const initialAutoResolve = await autoResolveQueuedActionGaps(
    token,
    current,
    session,
  );
  current = attachResolutionSession(initialAutoResolve.action, session);
  if (initialAutoResolve.resolved) {
    logAssistantDebug("action-resolution:auto-resolved", {
      actionId: current.id,
      payload: current.payload,
    });
    return {
      action: stripResolutionSession(current),
      aiCallsUsed: 0,
      terminal: true,
    };
  }
  if (initialAutoResolve.toolResults.length > 0) {
    logAssistantDebug("action-resolution:auto-tools", {
      actionId: current.id,
      tools: initialAutoResolve.toolResults.map((entry) => ({
        toolId: entry.toolId,
        args: entry.args,
        ok: entry.ok,
      })),
    });
  }

  for (let turn = 0; turn < ACTION_RESOLUTION_MAX_TURNS; turn += 1) {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: buildActionResolutionSystemInstruction(current.type),
        maxOutputTokens: ASSISTANT_MAX_OUTPUT_TOKENS,
        ...(thinkingConfig ? { thinkingConfig } : {}),
        tools: [{ functionDeclarations: RESOLUTION_LOOKUP_DECLARATIONS }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.VALIDATED,
            ...(getResolutionAllowedFunctionNames(current.type)
              ? {
                  allowedFunctionNames: getResolutionAllowedFunctionNames(
                    current.type,
                  ),
                }
              : {}),
          },
        },
      },
    });
    aiCallsUsed += 1;
    session.llmTurns += 1;

    const functionCalls = response.functionCalls;
    logAssistantDebug(`action-resolution:turn:${turn + 1}`, {
      finishReason: response.candidates?.[0]?.finishReason ?? "unknown",
      functionCalls: functionCalls?.length ?? 0,
      text: response.text?.trim() || null,
    });

    const modelParts = response.candidates?.[0]?.content?.parts;
    if (modelParts && modelParts.length > 0) {
      contents.push({ role: "model", parts: modelParts });
    }

    if (functionCalls && functionCalls.length > 0) {
      const responseParts = await Promise.all(
        functionCalls.map(async (call) => {
          const name = call.name?.trim() ?? "";
          const callId = call.id?.trim() || createToolCallId(name || "tool");
          const args = call.args ?? {};
          const result = await executeResolutionToolCall(token, name, args);

          session.toolResults.push({
            callId,
            toolId: name,
            args,
            ...result,
          });

          logAssistantDebug("action-resolution:tool", {
            actionId: current.id,
            callId,
            toolId: name,
            args,
            result,
          });

          return toFunctionResponsePart(callId, name, result);
        })
      );

      contents.push({ role: "user", parts: responseParts });
      current = attachResolutionSession(current, session);

      const postToolAutoResolve = await autoResolveQueuedActionGaps(
        token,
        current,
        session,
      );
      current = attachResolutionSession(postToolAutoResolve.action, session);
      if (postToolAutoResolve.resolved) {
        logAssistantDebug("action-resolution:auto-resolved-after-tool", {
          actionId: current.id,
          payload: current.payload,
        });
        return {
          action: stripResolutionSession(current),
          aiCallsUsed,
          terminal: true,
        };
      }
      continue;
    }

    const textRaw = response.text?.trim();
    if (textRaw) {
      logAssistantDebug(`action-resolution:text:${turn + 1}`, textRaw);
      const textOutput = parseResolutionOutput(textRaw);
      if (textOutput && isMeaningfulResolutionOutput(textOutput)) {
        const finalized = finalizeResolutionOutput(current, textOutput, aiCallsUsed);
        if (finalized) {
          return finalized;
        }
      }
    }

    const structured = await ai.models.generateContent({
      model,
      contents: [
        ...contents,
        {
          role: "user",
          parts: [
            {
              text: ACTION_RESOLUTION_FINAL_JSON_USER_MESSAGE,
            },
          ],
        },
      ],
      config: {
        systemInstruction: buildActionResolutionSystemInstruction(current.type),
        maxOutputTokens: ASSISTANT_MAX_OUTPUT_TOKENS,
        ...(thinkingConfig ? { thinkingConfig } : {}),
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              enum: ["ready", "needs_human", "failed"],
            },
            payload: getResolutionPayloadJsonSchema(current.type),
            message: { type: Type.STRING },
          },
          required: ["status"],
        },
      },
    });
    aiCallsUsed += 1;
    session.llmTurns += 1;

    const raw = structured.text?.trim();
    logAssistantDebug(`action-resolution:structured:${turn + 1}`, raw);
    const output = raw ? parseResolutionOutput(raw) : null;

    if (!output || !isMeaningfulResolutionOutput(output)) {
      contents.push({
        role: "user",
        parts: [
          {
            text: output
              ? ACTION_RESOLUTION_INCOMPLETE_PAYLOAD_USER_MESSAGE
              : ACTION_RESOLUTION_INVALID_JSON_USER_MESSAGE,
          },
        ],
      });
      current = attachResolutionSession(current, session);
      continue;
    }

    const finalized = finalizeResolutionOutput(current, output, aiCallsUsed);
    if (finalized) {
      return finalized;
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: ACTION_RESOLUTION_INCOMPLETE_PAYLOAD_USER_MESSAGE,
        },
      ],
    });
    current = attachResolutionSession(current, session);
  }

  const evaluated = evaluateQueuedAction(stripResolutionSession(current));
  return {
    action: {
      ...evaluated,
      error:
        evaluated.error ||
        "payload 정규화 반복 한도에 도달했습니다. 필드를 직접 입력해주세요.",
    },
    aiCallsUsed,
    terminal: true,
  };
}
