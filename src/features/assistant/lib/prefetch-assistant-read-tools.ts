import "server-only";

import { executeAssistantLookupTool } from "@admin/features/assistant/lib/execute-assistant-lookup-tool";
import { inferPrefetchReadToolCalls } from "@admin/features/assistant/lib/infer-prefetch-read-tool-calls";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";

export async function prefetchAssistantReadTools(
  token: string,
  message: string,
  existing: AssistantToolResultEntry[] = [],
): Promise<AssistantToolResultEntry[]> {
  const inferred = inferPrefetchReadToolCalls(message, existing);
  if (inferred.length === 0) {
    return existing;
  }

  const prefetched = [...existing];
  await Promise.all(
    inferred.map(async (call) => {
      try {
        const result = await executeAssistantLookupTool(
          token,
          call.toolId,
          call.args,
        );
        prefetched.push({
          callId: `prefetch-${call.toolId}-${crypto.randomUUID()}`,
          toolId: call.toolId,
          args: call.args,
          ok: result.ok,
          message: result.message,
          data: result.data,
        });
      } catch (error) {
        prefetched.push({
          callId: `prefetch-${call.toolId}-${crypto.randomUUID()}`,
          toolId: call.toolId,
          args: call.args,
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "조회 도구 실행 중 오류가 발생했습니다.",
        });
      }
    }),
  );

  return prefetched;
}
