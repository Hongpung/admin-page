import type { AssistantInputFieldConfig } from "@admin/features/assistant/lib/assistant-input-field-config";

export function parseFieldValue(
  config: AssistantInputFieldConfig,
  raw: string,
): unknown {
  if (config.widget === "boolean") {
    return raw === "true";
  }

  if (config.widget === "number") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (config.path === "reservationIds") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }

    return trimmed
      .split(/[,\s]+/)
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  if (config.path === "dayTimes") {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return raw.trim() || undefined;
}

export function formatInitialValue(
  config: AssistantInputFieldConfig,
  value: unknown,
) {
  if (value === undefined || value === null) return "";
  if (config.widget === "boolean") return value === true ? "true" : "false";
  if (config.path === "reservationIds" || config.path === "dayTimes") {
    return Array.isArray(value) ? JSON.stringify(value) : String(value);
  }
  return String(value);
}
