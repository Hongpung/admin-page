import "server-only";

import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_RESOLUTION_MODEL = "gemini-2.5-flash";

/** 텍스트 분석·도구 루프·액션 resolution 공통 출력 상한 */
export const ASSISTANT_MAX_OUTPUT_TOKENS = 50_000;
/** 이미지 시간표 추출 (thinking + 긴 detected_text/actions JSON) */
export const ASSISTANT_IMAGE_MAX_OUTPUT_TOKENS = 50_000;

let client: GoogleGenAI | null = null;

function requireEnterpriseApiKey(): string {
  const apiKey = process.env.GOOGLE_CLOUD_KEY?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_KEY 환경 변수가 필요합니다.");
  }
  return apiKey;
}

export function getAssistantModel(): string {
  return process.env.GOOGLE_CLOUD_MODEL?.trim() || DEFAULT_MODEL;
}

export function getAssistantImageModel(): string {
  return process.env.GOOGLE_CLOUD_IMAGE_MODEL?.trim() || getAssistantModel();
}

/** 큐 액션 payload 정규화(도구 호출 + structured output) */
export function getAssistantResolutionModel(): string {
  return (
    process.env.GOOGLE_CLOUD_RESOLUTION_MODEL?.trim() ||
    DEFAULT_RESOLUTION_MODEL
  );
}

/** env가 `0`일 때만 추론 끔. 그 외에는 thinkingConfig를 보내지 않음(모델 기본). */
export function getAssistantThinkingConfig():
  | { thinkingBudget: number }
  | undefined {
  if (process.env.GOOGLE_CLOUD_THINKING_BUDGET?.trim() === "0") {
    return { thinkingBudget: 0 };
  }
  return undefined;
}

export function getAssistantGenAiClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      enterprise: true,
      apiKey: requireEnterpriseApiKey(),
    });
  }
  return client;
}
