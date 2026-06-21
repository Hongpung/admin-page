"use client";

import { useEffect } from "react";
import { useAuiState, type ThreadMessageLike } from "@assistant-ui/react";
import { setLiveAssistantThreadMessages } from "@admin/features/assistant/lib/assistant-runtime-cache";

type ThreadMessageSnapshot = {
  role: string;
  content: readonly unknown[];
  metadata?: ThreadMessageLike["metadata"];
};

function exportThreadMessages(
  messages: readonly ThreadMessageSnapshot[],
): ThreadMessageLike[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content as ThreadMessageLike["content"],
      metadata: message.metadata,
    }));
}

export function AssistantThreadMessageSync() {
  const messages = useAuiState((state) => state.thread.messages);

  useEffect(() => {
    if (!messages.length) return;
    setLiveAssistantThreadMessages(exportThreadMessages(messages));
  }, [messages]);

  return null;
}
