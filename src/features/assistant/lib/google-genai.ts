import "server-only";

import { Type } from "@google/genai";
import { z } from "zod";
import type { AiContextRes } from "@admin/features/assistant/types/ai-api.types";
import {
  assistantActionSchema,
  assistantAnalysisSchema,
  syncPrimaryAssistantAction,
  type AssistantAnalysis,
} from "@admin/features/assistant/types/assistant-analysis.types";
import type { AssistantDraft } from "@admin/features/assistant/types/assistant-draft.types";
import type { AssistantAction } from "@admin/features/assistant/types/assistant-analysis.types";
import {
  ASSISTANT_IMAGE_MAX_OUTPUT_TOKENS,
  ASSISTANT_MAX_OUTPUT_TOKENS,
  getAssistantGenAiClient,
  getAssistantImageModel,
  getAssistantModel,
  getAssistantThinkingConfig,
} from "@admin/features/assistant/lib/assistant-genai-client";
import { logAssistantDebug } from "@admin/features/assistant/lib/assistant-debug-log";
import {
  buildImageExtractionUserPrompt,
  IMAGE_EXTRACTION_SYSTEM_INSTRUCTION,
} from "@admin/features/assistant/constants/assistant-prompts/image-extraction";
import {
  buildTextContinuationUserPrompt,
  TEXT_CONTINUATION_SYSTEM_INSTRUCTION,
} from "@admin/features/assistant/constants/assistant-prompts/text-continuation";
import {
  extractScheduleRowsFromDetectedText,
} from "@admin/features/assistant/lib/assistant-schedule-extract";
import { buildBatchActionsFromScheduleText } from "@admin/features/assistant/lib/build-batch-actions-from-schedule";
import {
  formatAssistantLookupResults,
  formatAssistantMutationToolCatalog,
  formatAssistantToolCatalogForPrompt,
  type AssistantLookupResultEntry,
} from "@admin/features/assistant/lib/assistant-tool-catalog";
import { getAssistantToolDefinition } from "@admin/features/assistant/lib/assistant-tool-definitions";

const modelOutputSchema = assistantAnalysisSchema.omit({ usage: true });

const imageExtractionOutputSchema = z.object({
  detected_text: z.string(),
  confidence: z.number().min(0).max(1),
  fallback_required: z.boolean(),
  action: assistantActionSchema.optional(),
  actions: z.array(assistantActionSchema).optional(),
});

export type ImageExtractionResult = z.infer<typeof imageExtractionOutputSchema>;

const ASSISTANT_ACTION_TYPE_ENUM = [
  "RESERVATION_BATCH_CREATE",
  "CREATE_RESERVATION",
  "CREATE_RESERVATIONS_MULTI",
  "DELETE_RESERVATION",
  "DELETE_RESERVATIONS_BATCH",
  "UPDATE_RESERVATION",
  "CREATE_NOTICE",
  "UPDATE_NOTICE",
  "DELETE_NOTICE",
  "CREATE_BANNER",
  "UPDATE_BANNER",
  "DELETE_BANNER",
  "UNKNOWN",
  "NONE",
] as const;

const BACKEND_COMMAND_NAME_ALIASES: Record<string, string> = {
  reservation_modify: "reservation_force_update",
};

function formatAvailableCommandLine(command: {
  name: string;
  description: string;
}): string {
  const toolId = BACKEND_COMMAND_NAME_ALIASES[command.name] ?? command.name;
  const definition = getAssistantToolDefinition(toolId);
  if (definition) {
    return `- ${definition.id}: ${definition.description}`;
  }
  return `- ${command.name}: ${command.description}`;
}

const DAY_TIME_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    day: {
      type: Type.STRING,
      enum: ["월", "화", "수", "목", "금", "토", "일"],
      description: "반복 예약 요일",
    },
    startTime: {
      type: Type.STRING,
      description: "시작 시간 HH:mm",
    },
    endTime: {
      type: Type.STRING,
      description: "종료 시간 HH:mm",
    },
  },
  required: ["day", "startTime", "endTime"],
};

const BATCH_RESERVATION_OPTION_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description:
        "연습 제목. 이미지 시간표의 동아리명 기반 정기 예약이면 '{동아리명}의 정기 연습'",
    },
    reservationType: {
      type: Type.STRING,
      enum: ["REGULAR", "COMMON", "EXTERNAL"],
      description: "정기 예약은 REGULAR",
    },
    creatorId: {
      type: Type.NUMBER,
      description: "조회 도구로 확인된 예약자 memberId. 추측 금지",
    },
    creatorName: {
      type: Type.STRING,
      description: "EXTERNAL 예약일 때 외부 예약자 이름",
    },
    clubName: {
      type: Type.STRING,
      description: "패짱 조회용 동아리명. 이미지에서 확인된 원문 동아리명",
    },
  },
  required: ["title", "reservationType"],
};

const ASSISTANT_PAYLOAD_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    // reservation_batch_create / RESERVATION_BATCH_CREATE
    dayTimes: {
      type: Type.ARRAY,
      description:
        "RESERVATION_BATCH_CREATE 필수. 같은 예약 주체의 요일·시간 배열",
      items: DAY_TIME_JSON_SCHEMA,
    },
    duration: {
      type: Type.OBJECT,
      description: "RESERVATION_BATCH_CREATE 필수 예약 기간",
      properties: {
        startDate: { type: Type.STRING, description: "YYYY-MM-DD" },
        endDate: { type: Type.STRING, description: "YYYY-MM-DD" },
      },
      required: ["startDate", "endDate"],
    },
    batchReservationOption: {
      ...BATCH_RESERVATION_OPTION_JSON_SCHEMA,
      description: "RESERVATION_BATCH_CREATE 필수 예약 옵션",
    },

    // reservation_force_create / CREATE_RESERVATION
    title: { type: Type.STRING },
    date: { type: Type.STRING, description: "YYYY-MM-DD" },
    startTime: { type: Type.STRING, description: "HH:mm" },
    endTime: { type: Type.STRING, description: "HH:mm" },
    reservationType: {
      type: Type.STRING,
      enum: ["REGULAR", "COMMON", "EXTERNAL"],
    },
    creatorId: { type: Type.NUMBER },
    creatorName: { type: Type.STRING },
    externalCreatorName: { type: Type.STRING },
    participationAvailable: { type: Type.BOOLEAN },

    // multi/delete/update common fields
    reservations: { type: Type.ARRAY, items: { type: Type.OBJECT } },
    reservationId: { type: Type.NUMBER },
    reservationIds: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    noticeId: { type: Type.NUMBER },
    bannerId: { type: Type.NUMBER },
    content: { type: Type.STRING },
    noticeAll: { type: Type.BOOLEAN },
    channel: { type: Type.STRING },
    owner: { type: Type.STRING },
    bannerImgUrl: { type: Type.STRING },
    startDate: { type: Type.STRING, description: "YYYY-MM-DD" },
    endDate: { type: Type.STRING, description: "YYYY-MM-DD" },
    href: { type: Type.STRING },
    patch: { type: Type.OBJECT },
  },
};

const ASSISTANT_ACTION_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: [...ASSISTANT_ACTION_TYPE_ENUM],
    },
    payload: ASSISTANT_PAYLOAD_JSON_SCHEMA,
    missing_fields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    status: {
      type: Type.STRING,
      enum: [
        "pending",
        "needs_input",
        "ready",
        "executing",
        "success",
        "error",
        "rejected",
      ],
    },
  },
  required: ["type"],
};

const IMAGE_EXTRACTION_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detected_text: {
      type: Type.STRING,
      description: "이미지에서 인식한 일정·시간·요일·동아리명 등 원문 텍스트",
    },
    confidence: {
      type: Type.NUMBER,
      description: "이미지 텍스트 인식 신뢰도 0~1",
    },
    fallback_required: {
      type: Type.BOOLEAN,
      description: "이미지 품질·텍스트 불명확으로 수동 확인이 필요한지",
    },
    action: ASSISTANT_ACTION_JSON_SCHEMA,
    actions: {
      type: Type.ARRAY,
      description:
        "실행 후보 액션 큐. 새 응답은 action 단일 객체보다 이 배열을 우선 사용하세요.",
      items: ASSISTANT_ACTION_JSON_SCHEMA,
    },
  },
  required: ["detected_text", "confidence", "fallback_required"],
};

const ANALYSIS_JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "이미지·요청에 대한 한국어 요약",
    },
    detected_text: {
      type: Type.STRING,
      description: "이미지에서 인식한 일정·시간·요일 등 텍스트",
    },
    admin_action_required: {
      type: Type.BOOLEAN,
      description: "관리자 확인·승인이 필요한 작업인지",
    },
    recommended_action: {
      type: Type.STRING,
      description: "권장 후속 작업 설명(한국어)",
    },
    confidence: {
      type: Type.NUMBER,
      description: "분석 신뢰도 0~1",
    },
    fallback_required: {
      type: Type.BOOLEAN,
      description:
        "이미지 품질·텍스트 불명확 등으로 관리자 수동 확인이 필요한지",
    },
    action: ASSISTANT_ACTION_JSON_SCHEMA,
    actions: {
      type: Type.ARRAY,
      description:
        "실행 후보 액션 큐. 여러 작업이면 action 단일 객체보다 이 배열을 우선 사용하세요.",
      items: ASSISTANT_ACTION_JSON_SCHEMA,
    },
  },
  required: [
    "summary",
    "detected_text",
    "admin_action_required",
    "recommended_action",
    "confidence",
    "fallback_required",
  ],
};

function formatContext(context: AiContextRes): string {
  const lines: string[] = [];

  if (context.domainSnapshot.reservations.length > 0) {
    lines.push("현재 예약:");
    for (const reservation of context.domainSnapshot.reservations) {
      lines.push(
        `- ${reservation.date} ${reservation.spaceName} (${reservation.status})`,
      );
    }
  }

  if (context.domainSnapshot.availableCommands.length > 0) {
    lines.push("", "사용 가능한 명령:");
    for (const command of context.domainSnapshot.availableCommands) {
      lines.push(formatAvailableCommandLine(command));
    }
  }

  const recentMessages = context.messages.slice(-3);
  if (recentMessages.length > 0) {
    lines.push("", "최근 대화:");
    for (const message of recentMessages) {
      const text = message.content
        .filter(
          (part): part is { type: "text"; text: string } =>
            part.type === "text" && typeof part.text === "string",
        )
        .map((part) => part.text)
        .join(" ")
        .trim();
      if (text) lines.push(`${message.role}: ${text}`);
    }
  }

  return lines.join("\n");
}

function formatDraft(draft: AssistantDraft | null): string {
  return JSON.stringify(
    draft ?? { queue: [], revision: 0, updatedAt: new Date().toISOString() },
    null,
    2,
  );
}

function formatImageExtraction(
  extraction: ImageExtractionResult | null,
): string {
  if (!extraction) return "(1차 이미지 분석 없음)";
  return JSON.stringify(extraction, null, 2);
}

type ContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

type JsonContentResponse = {
  text: string;
  finishReason: string;
};

async function requestJsonContent(args: {
  systemInstruction: string;
  userParts: ContentPart[];
  jsonSchema: typeof ANALYSIS_JSON_SCHEMA | typeof IMAGE_EXTRACTION_JSON_SCHEMA;
  model?: string;
  maxOutputTokens?: number;
  debugLabel: string;
}): Promise<JsonContentResponse> {
  const ai = getAssistantGenAiClient();
  const thinkingConfig = getAssistantThinkingConfig();

  const response = await ai.models.generateContent({
    model: args.model ?? getAssistantModel(),
    contents: [{ role: "user", parts: args.userParts }],
    config: {
      systemInstruction: args.systemInstruction,
      maxOutputTokens: args.maxOutputTokens ?? ASSISTANT_MAX_OUTPUT_TOKENS,
      ...(thinkingConfig ? { thinkingConfig } : {}),
      responseMimeType: "application/json",
      responseJsonSchema: args.jsonSchema,
    },
  });

  const finishReason = response.candidates?.[0]?.finishReason ?? "unknown";
  const text = response.text?.trim();
  logAssistantDebug(`${args.debugLabel}:response`, {
    model: args.model ?? getAssistantModel(),
    finishReason,
    usageMetadata: response.usageMetadata,
    text,
  });
  if (!text) {
    const thoughtsTokens = response.usageMetadata?.thoughtsTokenCount ?? 0;
    throw new Error(
      `AI 응답이 비어 있습니다. (finishReason=${finishReason}, thoughtsTokens=${thoughtsTokens})`,
    );
  }
  return { text, finishReason };
}

function buildTextContinuationPrompt(args: {
  message: string;
  context: AiContextRes;
  draft: AssistantDraft | null;
  toolResults: AssistantLookupResultEntry[];
  readLoopText: string | null;
  imageExtraction: ImageExtractionResult | null;
  missingFields: string[];
}): string {
  return buildTextContinuationUserPrompt({
    message: args.message,
    toolCatalog: formatAssistantToolCatalogForPrompt(),
    readToolResults: formatAssistantLookupResults(args.toolResults),
    readLoopText: args.readLoopText,
    draftJson: formatDraft(args.draft),
    imageExtractionJson: formatImageExtraction(args.imageExtraction),
    missingFields: args.missingFields,
    contextText: formatContext(args.context),
  });
}

type ImageInput = { buffer: Buffer; mimeType: string };

export type ExtractScheduleFromImageInput = {
  message: string;
  image: ImageInput;
};

export type ContinueAssistantRequestInput = {
  message: string;
  context: AiContextRes;
  draft?: AssistantDraft | null;
  toolResults?: AssistantLookupResultEntry[];
  readLoopText?: string | null;
  imageExtraction?: ImageExtractionResult | null;
  missingFields?: string[];
};

export type AssistantModelTurn = {
  analysis: AssistantAnalysis;
};

export function imageExtractionToAnalysis(
  extraction: ImageExtractionResult
): AssistantAnalysis {
  const actions =
    extraction.actions && extraction.actions.length > 0
      ? extraction.actions
      : extraction.action
        ? [extraction.action]
        : undefined;
  const primaryAction = actions?.[0];
  const hasMutationAction =
    actions?.some(
      (action) => action.type !== "NONE" && action.type !== "UNKNOWN",
    ) ?? false;

  return {
    summary: "",
    detected_text: extraction.detected_text,
    admin_action_required: hasMutationAction,
    recommended_action: "",
    confidence: extraction.confidence,
    fallback_required: extraction.fallback_required,
    action: primaryAction,
    actions,
  };
}

function parseImageExtraction(
  raw: string,
  options?: { message?: string; finishReason?: string },
): ImageExtractionResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    const recovered = recoverImageExtractionFromBrokenJson(raw);
    if (recovered) {
      return enrichImageExtractionWithFallbackActions(
        recovered,
        options?.message ?? "",
      );
    }
    throw new Error("이미지 분석 JSON 파싱에 실패했습니다.");
  }

  const parsed = imageExtractionOutputSchema.safeParse(json);
  if (!parsed.success) {
    const recovered = recoverImageExtractionFromBrokenJson(raw);
    if (recovered) {
      return enrichImageExtractionWithFallbackActions(
        recovered,
        options?.message ?? "",
      );
    }
    throw new Error("이미지 분석 응답 형식이 올바르지 않습니다.");
  }

  const extraction = parsed.data;
  if (
    options?.finishReason === "MAX_TOKENS" &&
    shouldPreferFallbackFromDetectedText(extraction)
  ) {
    return enrichImageExtractionWithFallbackActions(
      extraction,
      options?.message ?? "",
    );
  }

  return extraction;
}

function parseAssistantAnalysis(raw: string): AssistantAnalysis {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("AI 응답 JSON 파싱에 실패했습니다.");
  }

  const parsed = modelOutputSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  if (parsed.data.actions && parsed.data.actions.length > 0) {
    return {
      ...parsed.data,
      action: parsed.data.actions[0],
    };
  }

  return syncPrimaryAssistantAction(parsed.data);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getImageExtractionActions(
  extraction: ImageExtractionResult,
): AssistantAction[] {
  if (extraction.actions && extraction.actions.length > 0) {
    return extraction.actions;
  }
  if (extraction.action) {
    return [extraction.action];
  }
  return [];
}

const MAX_BATCH_TITLE_LENGTH = 120;

function hasMalformedBatchPayload(action: AssistantAction): boolean {
  if (action.type !== "RESERVATION_BATCH_CREATE") return false;
  if (!isPlainRecord(action.payload)) return true;

  const payload = action.payload;
  const option = isPlainRecord(payload.batchReservationOption)
    ? payload.batchReservationOption
    : null;
  const rootTitle =
    typeof payload.title === "string" ? payload.title.trim() : "";
  const optionTitle =
    typeof option?.title === "string" ? option.title.trim() : "";

  if (!option && rootTitle) return true;
  if (rootTitle.length > MAX_BATCH_TITLE_LENGTH) return true;
  if (optionTitle.length > MAX_BATCH_TITLE_LENGTH) return true;
  if (/batch-action|\.json|_REGULAR_/i.test(`${rootTitle}${optionTitle}`)) {
    return true;
  }

  return false;
}

function shouldPreferFallbackFromDetectedText(
  extraction: ImageExtractionResult,
): boolean {
  const rows = extractScheduleRowsFromDetectedText(extraction.detected_text);
  if (rows.length === 0) return false;

  const batchActions = getImageExtractionActions(extraction).filter(
    (action) => action.type === "RESERVATION_BATCH_CREATE",
  );
  if (batchActions.length === 0) return true;
  if (batchActions.length < rows.length) return true;
  if (batchActions.some((action) => hasMalformedBatchPayload(action))) {
    return true;
  }

  return false;
}

function extractJsonStringField(raw: string, field: string): string | null {
  const pattern = new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`);
  const match = raw.match(pattern);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function recoverImageExtractionFromBrokenJson(
  raw: string,
): ImageExtractionResult | null {
  const detected_text = extractJsonStringField(raw, "detected_text")?.trim();
  if (!detected_text) return null;

  const confidenceMatch = raw.match(/"confidence"\s*:\s*([\d.]+)/);
  const fallbackMatch = raw.match(/"fallback_required"\s*:\s*(true|false)/);

  return {
    detected_text,
    confidence: confidenceMatch ? Number(confidenceMatch[1]) : 0.5,
    fallback_required: fallbackMatch?.[1] === "true",
  };
}

function hasEmptyBatchPayloadActions(extraction: ImageExtractionResult): boolean {
  return getImageExtractionActions(extraction).some(
    (action) =>
      action.type === "RESERVATION_BATCH_CREATE" &&
      (!action.payload || Object.keys(action.payload).length === 0),
  );
}

function buildFallbackBatchActionsFromImageText(
  extraction: ImageExtractionResult,
  message: string,
): AssistantAction[] {
  return buildBatchActionsFromScheduleText(
    message,
    extraction.detected_text,
    [],
    { groupByClub: false },
  );
}

export function enrichImageExtractionWithFallbackActions(
  extraction: ImageExtractionResult,
  message: string,
): ImageExtractionResult {
  const shouldRecover =
    hasEmptyBatchPayloadActions(extraction) ||
    shouldPreferFallbackFromDetectedText(extraction);
  if (!shouldRecover) return extraction;

  const actions = buildFallbackBatchActionsFromImageText(extraction, message);
  if (actions.length === 0) return extraction;

  return {
    ...extraction,
    action: actions[0],
    actions,
  };
}

/** 1차: 이미지와 텍스트 요청에서 실행 후보 parsed-data 추출. 프롬프트: `IMAGE_EXTRACTION_SYSTEM_INSTRUCTION` */
export async function extractScheduleFromImage(
  input: ExtractScheduleFromImageInput
): Promise<ImageExtractionResult> {
  const userPrompt = buildImageExtractionUserPrompt(
    input.message,
    formatAssistantMutationToolCatalog(),
  );
  logAssistantDebug("image-extraction:prompt", userPrompt);
  const { text: raw, finishReason } = await requestJsonContent({
    systemInstruction: IMAGE_EXTRACTION_SYSTEM_INSTRUCTION,
    userParts: [
      { text: userPrompt },
      {
        inlineData: {
          mimeType: input.image.mimeType,
          data: input.image.buffer.toString("base64"),
        },
      },
    ],
    jsonSchema: IMAGE_EXTRACTION_JSON_SCHEMA,
    model: getAssistantImageModel(),
    maxOutputTokens: ASSISTANT_IMAGE_MAX_OUTPUT_TOKENS,
    debugLabel: "image-extraction",
  });
  const parsed = enrichImageExtractionWithFallbackActions(
    parseImageExtraction(raw, {
      message: input.message,
      finishReason,
    }),
    input.message,
  );
  logAssistantDebug("image-extraction:parsed", parsed);
  return parsed;
}

/** 2차: 텍스트 + draft 기반 분석 (이미지 없음). 프롬프트: `TEXT_CONTINUATION_SYSTEM_INSTRUCTION` */
export async function continueAssistantModelTurn(
  input: ContinueAssistantRequestInput
): Promise<AssistantModelTurn> {
  const prompt = buildTextContinuationPrompt({
    message: input.message,
    context: input.context,
    draft: input.draft ?? null,
    toolResults: input.toolResults ?? [],
    readLoopText: input.readLoopText ?? null,
    imageExtraction: input.imageExtraction ?? null,
    missingFields: input.missingFields ?? [],
  });
  logAssistantDebug("text-continuation:prompt", prompt);
  const { text: raw } = await requestJsonContent({
    systemInstruction: TEXT_CONTINUATION_SYSTEM_INSTRUCTION,
    userParts: [
      {
        text: prompt,
      },
    ],
    jsonSchema: ANALYSIS_JSON_SCHEMA,
    debugLabel: "text-continuation",
  });
  const analysis = parseAssistantAnalysis(raw);
  logAssistantDebug("text-continuation:parsed", analysis);
  return { analysis };
}

/** 최종 structured analysis만 필요할 때 */
export async function continueAssistantRequest(
  input: ContinueAssistantRequestInput
): Promise<AssistantAnalysis> {
  const turn = await continueAssistantModelTurn(input);
  return turn.analysis;
}
