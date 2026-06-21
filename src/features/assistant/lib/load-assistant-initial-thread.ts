import { getStoredAssistantAnalysis } from "@admin/features/assistant/lib/assistant-session-storage";
import type { ThreadMessageLike } from "@assistant-ui/react";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function extractTextFromContent(content: unknown): string {
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (!isPlainRecord(part)) return "";
      if (part.type === "text" && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

export async function loadAssistantInitialThread(
  roomId: string,
): Promise<ThreadMessageLike[]> {
  try {
    const response = await fetch(
      `/api/assistant/context?roomId=${encodeURIComponent(roomId)}&limit=50`,
      { credentials: "include", cache: "no-store" },
    );
    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    if (!isPlainRecord(payload) || !Array.isArray(payload.messages)) {
      return [];
    }

    const messages: ThreadMessageLike[] = [];
    for (const item of payload.messages) {
      if (!isPlainRecord(item)) continue;
      const role = item.role;
      if (role !== "user" && role !== "assistant") continue;

      const text = extractTextFromContent(item.content);
      if (!text) continue;

      messages.push({
        role,
        content: [{ type: "text", text }],
      });
    }

    const storedAnalysis = getStoredAssistantAnalysis(roomId);
    if (messages.length === 0) {
      return messages;
    }

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.role !== "assistant") continue;

      messages[index] = {
        ...message,
        metadata: {
          custom: {
            ...(storedAnalysis ? { analysis: storedAnalysis } : {}),
            roomId,
          },
        },
      };
      break;
    }

    return messages;
  } catch {
    return [];
  }
}
