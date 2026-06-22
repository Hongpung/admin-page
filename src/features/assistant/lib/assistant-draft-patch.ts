export function getValueAtPath(
  source: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (!source) return undefined;

  const parts = path.split(".");
  let current: unknown = source;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;

    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
      continue;
    }

    return undefined;
  }

  return current;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneRecord(source: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
}

export function setValueAtPath(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const root = cloneRecord(source);
  const parts = path.split(".");
  let current: unknown = root;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index]!;
    const nextPart = parts[index + 1]!;
    const isArrayIndex = /^\d+$/.test(nextPart);

    if (Array.isArray(current)) {
      const arrayIndex = Number(part);
      if (!current[arrayIndex] || typeof current[arrayIndex] !== "object") {
        current[arrayIndex] = isArrayIndex ? [] : {};
      }
      current = current[arrayIndex];
      continue;
    }

    const record = current as Record<string, unknown>;
    const existing = record[part];
    if (
      existing === undefined ||
      existing === null ||
      (isArrayIndex && !Array.isArray(existing)) ||
      (!isArrayIndex &&
        (typeof existing !== "object" || Array.isArray(existing)))
    ) {
      record[part] = isArrayIndex ? [] : {};
    }
    current = record[part];
  }

  const last = parts[parts.length - 1]!;
  if (Array.isArray(current)) {
    current[Number(last)] = value;
  } else if (isPlainRecord(current) || current === root) {
    (current as Record<string, unknown>)[last] = value;
  }

  return root;
}

function mergePayload(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current };

  for (const [key, value] of Object.entries(patch)) {
    if (isPlainRecord(value) && isPlainRecord(next[key])) {
      next[key] = mergePayload(
        next[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      );
      continue;
    }

    next[key] = value;
  }

  return next;
}

export function buildPatchFromPath(
  path: string,
  value: unknown,
): Record<string, unknown> {
  return setValueAtPath({}, path, value);
}

export function buildPatchFromFormValues(
  entries: Array<{ path: string; value: unknown }>,
): Record<string, unknown> {
  return entries.reduce<Record<string, unknown>>((patch, entry) => {
    if (entry.value === undefined || entry.value === "") {
      return patch;
    }
    return mergePayload(patch, buildPatchFromPath(entry.path, entry.value));
  }, {});
}
