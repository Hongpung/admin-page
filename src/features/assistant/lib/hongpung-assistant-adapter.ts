import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";
import {
  assistantAnalysisSchema,
  formatAssistantSummary,
} from "@admin/features/assistant/types/assistant-analysis.types";
import { ensureAssistantRoom } from "@admin/features/assistant/lib/assistant-room";

type HongpungAssistantAdapterOptions = {
  getRoomId: () => string | null;
  setRoomId: (roomId: string) => void;
};

function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const [header, data] = dataUrl.split(",", 2);
    if (!header || !data) return null;

    const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  } catch {
    return null;
  }
}

async function imagePartToFile(
  image: string,
  filename = "upload.jpg",
): Promise<File | null> {
  if (image.startsWith("data:")) {
    return dataUrlToFile(image, filename);
  }

  try {
    const response = await fetch(image);
    const blob = await response.blob();
    return new File([blob], filename, {
      type: blob.type || "image/jpeg",
    });
  } catch {
    return null;
  }
}

function getLastUserMessage(messages: readonly ThreadMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user");
}

function imagePartInfo(
  part: ThreadMessage["content"][number],
  fallbackFilename: string,
) {
  if (part.type === "image") {
    return {
      image: part.image,
      filename: part.filename ?? fallbackFilename,
    };
  }

  if (
    part.type === "file" &&
    typeof part.mimeType === "string" &&
    part.mimeType.startsWith("image/")
  ) {
    return {
      image: `data:${part.mimeType};base64,${part.data}`,
      filename: part.filename ?? fallbackFilename,
    };
  }

  return null;
}

function extractImageFromMessage(message: ThreadMessage) {
  for (const part of message.content) {
    const info = imagePartInfo(part, "schedule.jpg");
    if (info) return info;
  }

  // assistant-ui는 첨부 이미지를 content가 아닌 attachments에 둡니다.
  for (const attachment of message.attachments ?? []) {
    if (attachment.type !== "image") continue;

    for (const part of attachment.content ?? []) {
      const info = imagePartInfo(part, attachment.name ?? "schedule.jpg");
      if (info) return info;
    }
  }

  return null;
}

export function createHongpungAssistantAdapter({
  getRoomId,
  setRoomId,
}: HongpungAssistantAdapterOptions): ChatModelAdapter {
  return {
    async run({ messages, abortSignal }) {
      const lastUserMessage = getLastUserMessage(messages);
      if (!lastUserMessage) {
        return {
          content: [{ type: "text", text: "메시지를 입력해주세요." }],
        };
      }

      const text = lastUserMessage.content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n")
        .trim();

      const imageInfo = extractImageFromMessage(lastUserMessage);

      if (!text && !imageInfo) {
        return {
          content: [
            {
              type: "text",
              text: "텍스트 또는 이미지를 함께 보내주세요.",
            },
          ],
        };
      }

      const formData = new FormData();
      if (text) formData.set("message", text);

      if (imageInfo) {
        const file = await imagePartToFile(
          imageInfo.image,
          imageInfo.filename,
        );
        if (!file) {
          return {
            content: [
              {
                type: "text",
                text: "이미지를 처리하지 못했습니다. 다시 첨부해주세요.",
              },
            ],
            status: { type: "incomplete", reason: "error" },
          };
        }
        formData.set("image", file);
      }

      try {
        const roomId = await ensureAssistantRoom({ getRoomId, setRoomId });
        formData.set("roomId", roomId);

        const response = await fetch("/api/assistant/analyze", {
          method: "POST",
          body: formData,
          credentials: "include",
          signal: abortSignal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let message = errorText || "분석 요청에 실패했습니다.";

          if (response.status === 429) {
            try {
              const payload = JSON.parse(errorText) as {
                error?: string;
                usage?: { monthlyUsed?: number; monthlyLimit?: number };
              };
              if (payload.error) {
                message = payload.error;
              }
              if (
                payload.usage?.monthlyUsed !== undefined &&
                payload.usage?.monthlyLimit !== undefined
              ) {
                message += ` (${payload.usage.monthlyUsed}/${payload.usage.monthlyLimit})`;
              }
            } catch {
              // noop
            }
          }

          return {
            content: [{ type: "text", text: message }],
            status: { type: "incomplete", reason: "error" },
          };
        }

        const payload: unknown = await response.json();
        const parsed = assistantAnalysisSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            content: [
              {
                type: "text",
                text: "분석 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요.",
              },
            ],
            status: { type: "incomplete", reason: "error" },
          };
        }

        return {
          content: [{ type: "text", text: formatAssistantSummary(parsed.data) }],
          metadata: {
            custom: { analysis: parsed.data },
          },
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }

        return {
          content: [
            {
              type: "text",
              text: "분석 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.",
            },
          ],
          status: { type: "incomplete", reason: "error" },
        };
      }
    },
  };
}
