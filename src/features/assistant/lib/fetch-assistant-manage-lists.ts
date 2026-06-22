import "server-only";

function requireBaseUrl(): string {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL is not configured");
  }
  return baseUrl;
}

function extractList(payload: unknown, keys: readonly string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

export async function fetchAssistantNoticesList(token: string) {
  const response = await fetch(`${requireBaseUrl()}/notice`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("공지 목록 조회에 실패했습니다.");
  }

  const payload: unknown = await response.json();
  return extractList(payload, ["notices", "items", "data"]);
}

export async function fetchAssistantNoticeDetail(
  token: string,
  noticeId: number,
) {
  const response = await fetch(`${requireBaseUrl()}/notice/${noticeId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload: unknown = await response.json();
  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : null;
}

export async function fetchAssistantBannersList(token: string) {
  const response = await fetch(`${requireBaseUrl()}/banner`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("배너 목록 조회에 실패했습니다.");
  }

  const payload: unknown = await response.json();
  return extractList(payload, ["banners", "items", "data"]);
}

export async function fetchAssistantBannerDetail(
  token: string,
  bannerId: number,
) {
  const response = await fetch(`${requireBaseUrl()}/banner/${bannerId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload: unknown = await response.json();
  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : null;
}
