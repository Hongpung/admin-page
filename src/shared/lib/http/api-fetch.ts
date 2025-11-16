async function readErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { message?: unknown };
    if (typeof json?.message === "string" && json.message.trim()) {
      return json.message;
    }
  } catch {
    // noop
  }

  if (response.statusText) return response.statusText;
  return `HTTP ${response.status}`;
}

async function requestOk(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await requestOk(input, init);
  return (await response.json()) as T;
}

export async function requestVoid(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<void> {
  await requestOk(input, init);
}
