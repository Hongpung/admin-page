export type AdminRole = "SUPER" | "SUB";

function toBase64(input: string): string {
  let payload = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = payload.length % 4;
  if (pad) payload += "=".repeat(4 - pad);
  return payload;
}

/** JWT 서명 검증 없이 페이로드만 base64url 디코드합니다. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(toBase64(parts[1]), "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeRole(value: unknown): AdminRole | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  if (upper === "SUPER" || upper === "SUB") return upper;
  return null;
}

export function pickAdminRole(
  payload: Record<string, unknown> | null,
): AdminRole | null {
  if (!payload) return null;

  return (
    normalizeRole(payload.adminLevel) ??
    normalizeRole(payload.admin_level) ??
    normalizeRole(payload.adminRole) ??
    normalizeRole(payload.role)
  );
}

export function pickMemberId(payload: Record<string, unknown>): number | null {
  const keys = ["memberId", "adminId", "sub", "userId"] as const;
  for (const key of keys) {
    const v = payload[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  }
  return null;
}

export function pickExpiresInSeconds(
  payload: Record<string, unknown> | null,
): number {
  if (!payload) return 0;

  const exp = payload.exp;
  const expSeconds =
    typeof exp === "number"
      ? exp
      : typeof exp === "string" && /^\d+$/.test(exp)
        ? Number(exp)
        : null;

  if (!expSeconds || !Number.isFinite(expSeconds)) return 0;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.max(expSeconds - nowSeconds, 0);
}
