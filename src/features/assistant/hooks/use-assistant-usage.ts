"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuiState } from "@assistant-ui/react";
import { aiUsageCheckResSchema } from "@admin/features/assistant/types/ai-api.types";

type AssistantUsage = {
  used: number;
  limit: number;
};

export function useAssistantUsage() {
  const [usage, setUsage] = useState<AssistantUsage | null>(null);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const wasRunningRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/assistant/usage/check", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;

      const payload: unknown = await response.json();
      const parsed = aiUsageCheckResSchema.safeParse(payload);
      if (!parsed.success) return;

      setUsage({ used: parsed.data.used, limit: parsed.data.limit });
    } catch {
      // usage 표시는 부가 정보이므로 조용히 무시
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (wasRunningRef.current && !isRunning) {
      void refresh();
    }
    wasRunningRef.current = isRunning;
  }, [isRunning, refresh]);

  return { usage, refresh };
}
