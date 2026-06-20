import "server-only";

import {
  aiContextResSchema,
  aiUsageCheckResSchema,
} from "@admin/features/assistant/types/ai-api.types";

function requireBaseUrl(): string {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL is not configured");
  }
  return baseUrl;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { message?: unknown };
    if (typeof json?.message === "string" && json.message.trim()) {
      return json.message;
    }
  } catch {
    // noop
  }

  return (await response.text()) || response.statusText || `HTTP ${response.status}`;
}

async function parseJsonResponse<T>(
  response: Response,
  schema: {
    safeParse: (value: unknown) => { success: true; data: T } | { success: false };
  },
): Promise<T> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("메인 서버 응답 형식이 올바르지 않습니다.");
  }

  return parsed.data;
}

export async function checkAiUsage(token: string) {
  const response = await fetch(`${requireBaseUrl()}/admin/ai/usage/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonResponse(response, aiUsageCheckResSchema);
}

type GetAiContextOptions = {
  limit?: number;
  roomId: string;
};

export async function getAiContext(
  token: string,
  { limit = 20, roomId }: GetAiContextOptions,
) {
  const url = new URL(`${requireBaseUrl()}/admin/ai/context`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("roomId", roomId);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonResponse(response, aiContextResSchema);
}
