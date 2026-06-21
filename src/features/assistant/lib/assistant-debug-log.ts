import "server-only";

export function isAssistantDebugAiEnabled(): boolean {
  return process.env.ASSISTANT_DEBUG_AI === "1";
}

export function logAssistantDebug(label: string, payload: unknown) {
  if (!isAssistantDebugAiEnabled()) return;

  try {
    console.info(
      `[assistant-debug] ${label}`,
      typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
    );
  } catch {
    console.info(`[assistant-debug] ${label}`, payload);
  }
}
