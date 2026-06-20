import { createAssistantRoomResSchema } from "@admin/features/assistant/types/ai-api.types";

type EnsureAssistantRoomOptions = {
  getRoomId: () => string | null;
  setRoomId: (roomId: string) => void;
};

export async function ensureAssistantRoom({
  getRoomId,
  setRoomId,
}: EnsureAssistantRoomOptions): Promise<string> {
  const existingRoomId = getRoomId();
  if (existingRoomId) {
    return existingRoomId;
  }

  const response = await fetch("/api/assistant/rooms", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI 대화방을 만들지 못했습니다.");
  }

  const payload: unknown = await response.json();
  const parsed = createAssistantRoomResSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("AI 대화방 응답 형식이 올바르지 않습니다.");
  }

  setRoomId(parsed.data.roomId);
  return parsed.data.roomId;
}
