import type { ThreadMessageLike } from "@assistant-ui/react";
import type { AssistantAnalysis } from "@admin/features/assistant/types/assistant-analysis.types";
import { assistantAnalysisSchema } from "@admin/features/assistant/types/assistant-analysis.types";

const ROOM_ID_KEY = "hongpung:assistant:roomId";
const ANALYSIS_KEY_PREFIX = "hongpung:assistant:analysis:";
const THREAD_KEY_PREFIX = "hongpung:assistant:thread:";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getStoredAssistantRoomId(): string | null {
  if (!canUseSessionStorage()) return null;
  const value = window.sessionStorage.getItem(ROOM_ID_KEY)?.trim();
  return value || null;
}

export function setStoredAssistantRoomId(roomId: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(ROOM_ID_KEY, roomId);
}

export function clearStoredAssistantRoomId(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(ROOM_ID_KEY);
}

export function getStoredAssistantAnalysis(
  roomId: string,
): AssistantAnalysis | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(`${ANALYSIS_KEY_PREFIX}${roomId}`);
  if (!raw) return null;

  try {
    const parsed = assistantAnalysisSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function setStoredAssistantAnalysis(
  roomId: string,
  analysis: AssistantAnalysis,
): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(
    `${ANALYSIS_KEY_PREFIX}${roomId}`,
    JSON.stringify(analysis),
  );
}

export function clearStoredAssistantAnalysis(roomId: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(`${ANALYSIS_KEY_PREFIX}${roomId}`);
}

function isThreadRole(role: unknown): role is "user" | "assistant" {
  return role === "user" || role === "assistant";
}

export function getStoredAssistantThreadMessages(
  roomId: string,
): ThreadMessageLike[] | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(`${THREAD_KEY_PREFIX}${roomId}`);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const messages: ThreadMessageLike[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;
      if (!isThreadRole(role) || !Array.isArray(content)) continue;
      messages.push({
        role,
        content: content as ThreadMessageLike["content"],
        metadata: (item as { metadata?: ThreadMessageLike["metadata"] }).metadata,
      });
    }

    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

export function setStoredAssistantThreadMessages(
  roomId: string,
  messages: readonly ThreadMessageLike[],
): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(
    `${THREAD_KEY_PREFIX}${roomId}`,
    JSON.stringify(messages),
  );
}

export function clearStoredAssistantThreadMessages(roomId: string): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(`${THREAD_KEY_PREFIX}${roomId}`);
}
