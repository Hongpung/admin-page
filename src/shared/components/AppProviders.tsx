"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@admin/shared/components/QueryProvider";
import { AssistantGlobalHost } from "@admin/features/assistant/components/AssistantGlobalHost";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <AssistantGlobalHost />
    </QueryProvider>
  );
}
