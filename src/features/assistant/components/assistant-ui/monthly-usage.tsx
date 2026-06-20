"use client";

import type { FC } from "react";
import { ASSISTANT_LABELS } from "@admin/features/assistant/constants/assistant-labels";
import { useAssistantUsage } from "@admin/features/assistant/hooks/use-assistant-usage";
import { cn } from "@admin/shared/lib/cn";

export const AssistantMonthlyUsage: FC = () => {
  const { usage } = useAssistantUsage();

  if (!usage) return null;

  const isNearLimit = usage.used >= usage.limit;
  const isWarning = !isNearLimit && usage.used / usage.limit >= 0.8;

  return (
    <p
      className={cn(
        "text-center text-xs tabular-nums",
        isNearLimit && "text-red-600",
        isWarning && "text-amber-700",
        !isNearLimit && !isWarning && "text-gray-500",
      )}
      aria-live="polite"
    >
      {ASSISTANT_LABELS.monthlyUsage(usage.used, usage.limit)}
    </p>
  );
};
