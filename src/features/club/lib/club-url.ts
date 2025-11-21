export type ParsedClubIdQuery =
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "valid"; clubId: number };

export function parseClubIdQuery(raw: string | null): ParsedClubIdQuery {
  if (raw === null) return { kind: "missing" };

  if (!/^\d+$/.test(raw)) {
    return { kind: "invalid" };
  }

  const clubId = Number(raw);
  if (!Number.isSafeInteger(clubId) || clubId < 0) {
    return { kind: "invalid" };
  }

  return { kind: "valid", clubId };
}
