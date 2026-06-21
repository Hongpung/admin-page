const SUMMARY_CHUNK_SIZE = 12;
const SUMMARY_CHUNK_DELAY_MS = 18;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* streamAssistantSummaryText(
  summary: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const text = summary.trim();
  if (!text) {
    yield "";
    return;
  }

  for (let index = SUMMARY_CHUNK_SIZE; index < text.length; index += SUMMARY_CHUNK_SIZE) {
    if (signal?.aborted) {
      yield text;
      return;
    }

    yield text.slice(0, index);
    await sleep(SUMMARY_CHUNK_DELAY_MS);
  }

  yield text;
}
