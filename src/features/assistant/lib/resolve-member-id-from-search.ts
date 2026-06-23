import type { AssistantMemberSearchItem } from "@admin/features/assistant/lib/fetch-assistant-members";
import type { AssistantToolResultEntry } from "@admin/features/assistant/lib/assistant-tool-loop";

type MemberLookupItem = {
  memberId?: number;
  name?: string;
  nickname?: string | null;
};

export type MemberLookupCandidate = {
  memberId: number;
  name: string;
  nickname?: string | null;
  score: number;
};

export type MemberLookupResolution =
  | { status: "not_found"; query: string }
  | {
      status: "matched";
      query: string;
      memberId: number;
      candidate: MemberLookupCandidate;
    }
  | { status: "ambiguous"; query: string; candidates: MemberLookupCandidate[] };

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function toCandidate(
  member: MemberLookupItem,
  score: number,
): MemberLookupCandidate | null {
  if (typeof member.memberId !== "number" || member.memberId <= 0) {
    return null;
  }

  return {
    memberId: member.memberId,
    name: member.name ?? "",
    nickname: member.nickname,
    score,
  };
}

export function scoreMemberNameMatch(
  member: MemberLookupItem,
  query: string,
): number {
  const normalizedQuery = normalizeToken(query);
  const name = normalizeToken(member.name ?? "");
  const nickname = normalizeToken(member.nickname ?? "");

  if (!normalizedQuery) return 0;
  if (name === normalizedQuery || nickname === normalizedQuery) return 100;
  if (name.includes(normalizedQuery) || nickname.includes(normalizedQuery)) {
    return 80;
  }
  if (
    normalizedQuery.includes(name) &&
    name.length >= 2 &&
    name !== normalizedQuery
  ) {
    return 60;
  }
  return 0;
}

export function resolveMemberLookup(
  query: string,
  members: MemberLookupItem[],
): MemberLookupResolution {
  const trimmed = query.trim();
  if (!trimmed) {
    return { status: "not_found", query: trimmed };
  }

  if (members.length === 0) {
    return { status: "not_found", query: trimmed };
  }

  const scored = members
    .map((member) => ({
      member,
      score: scoreMemberNameMatch(member, trimmed),
    }))
    .filter((item) => {
      const candidate = toCandidate(item.member, item.score);
      return candidate != null && item.score > 0;
    })
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    const candidates = members
      .map((member) => toCandidate(member, 0))
      .filter((candidate): candidate is MemberLookupCandidate => candidate != null);

    return {
      status: "ambiguous",
      query: trimmed,
      candidates,
    };
  }

  const best = scored[0]!;
  const bestCandidate = toCandidate(best.member, best.score);
  if (!bestCandidate) {
    return { status: "not_found", query: trimmed };
  }

  if (best.score >= 100) {
    const exactMatches = scored
      .filter((item) => item.score === 100)
      .map((item) => toCandidate(item.member, item.score))
      .filter((candidate): candidate is MemberLookupCandidate => candidate != null);

    if (exactMatches.length === 1) {
      return {
        status: "matched",
        query: trimmed,
        memberId: exactMatches[0]!.memberId,
        candidate: exactMatches[0]!,
      };
    }

    return {
      status: "ambiguous",
      query: trimmed,
      candidates: exactMatches,
    };
  }

  if (best.score >= 80) {
    const strongMatches = scored
      .filter((item) => item.score >= 80)
      .map((item) => toCandidate(item.member, item.score))
      .filter((candidate): candidate is MemberLookupCandidate => candidate != null);

    if (strongMatches.length === 1) {
      return {
        status: "matched",
        query: trimmed,
        memberId: strongMatches[0]!.memberId,
        candidate: strongMatches[0]!,
      };
    }

    return {
      status: "ambiguous",
      query: trimmed,
      candidates: strongMatches,
    };
  }

  if (scored.length === 1 && best.score >= 60) {
    return {
      status: "matched",
      query: trimmed,
      memberId: bestCandidate.memberId,
      candidate: bestCandidate,
    };
  }

  const plausibleMatches = scored
    .filter((item) => item.score >= 60)
    .map((item) => toCandidate(item.member, item.score))
    .filter((candidate): candidate is MemberLookupCandidate => candidate != null);

  if (plausibleMatches.length > 0) {
    return {
      status: "ambiguous",
      query: trimmed,
      candidates: plausibleMatches,
    };
  }

  const fallbackCandidates = scored
    .map((item) => toCandidate(item.member, item.score))
    .filter((candidate): candidate is MemberLookupCandidate => candidate != null);

  return {
    status: "ambiguous",
    query: trimmed,
    candidates: fallbackCandidates,
  };
}

export function resolveMemberIdFromSearchResults(
  query: string,
  members: MemberLookupItem[],
): number | null {
  const resolution = resolveMemberLookup(query, members);
  return resolution.status === "matched" ? resolution.memberId : null;
}

export function collectMemberLookupResults(
  toolResults: AssistantToolResultEntry[],
  username: string,
): MemberLookupItem[] {
  const entry = toolResults.find(
    (result) =>
      result.ok &&
      result.toolId === "members_search_lookup" &&
      result.data &&
      (typeof result.args.username !== "string" ||
        normalizeToken(result.args.username) === normalizeToken(username)),
  );

  const members = entry?.data?.members;
  if (!Array.isArray(members)) return [];
  return members as MemberLookupItem[];
}

export function resolveCreatorIdFromMemberLookup(
  username: string,
  toolResults: AssistantToolResultEntry[],
): number | null {
  const members = collectMemberLookupResults(toolResults, username);
  return resolveMemberIdFromSearchResults(username, members);
}

export function resolveMemberLookupFromMemberLookup(
  username: string,
  toolResults: AssistantToolResultEntry[],
): MemberLookupResolution {
  const members = collectMemberLookupResults(toolResults, username);
  return resolveMemberLookup(username, members);
}

export async function resolveMemberLookupFromNameOrId(
  lookup: (username: string) => Promise<AssistantMemberSearchItem[]>,
  value: unknown,
): Promise<MemberLookupResolution> {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return {
      status: "matched",
      query: String(value),
      memberId: value,
      candidate: {
        memberId: value,
        name: String(value),
        score: 100,
      },
    };
  }

  if (typeof value !== "string") {
    return { status: "not_found", query: "" };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { status: "not_found", query: "" };
  }

  if (/^\d+$/.test(trimmed)) {
    const parsed = Number(trimmed);
    if (Number.isInteger(parsed) && parsed > 0) {
      return {
        status: "matched",
        query: trimmed,
        memberId: parsed,
        candidate: {
          memberId: parsed,
          name: trimmed,
          score: 100,
        },
      };
    }
    return { status: "not_found", query: trimmed };
  }

  const members = await lookup(trimmed);
  return resolveMemberLookup(trimmed, members);
}

export async function resolveMemberIdFromNameOrId(
  lookup: (username: string) => Promise<AssistantMemberSearchItem[]>,
  value: unknown,
): Promise<number | null> {
  const resolution = await resolveMemberLookupFromNameOrId(lookup, value);
  return resolution.status === "matched" ? resolution.memberId : null;
}

export function formatMemberLookupCandidatesMessage(
  query: string,
  candidates: MemberLookupCandidate[],
): string {
  if (candidates.length === 0) {
    return `'${query}' 회원을 찾지 못했습니다. 다른 이름을 입력하거나 그대로 진행하면 외부(EXTERNAL) 예약으로 등록됩니다.`;
  }

  const lines = candidates.slice(0, 5).map((candidate) => {
    const nickname = candidate.nickname?.trim()
      ? ` (${candidate.nickname})`
      : "";
    return `${candidate.name}${nickname}`;
  });

  return [
    `'${query}' 검색 결과가 여러 명이거나 정확히 일치하지 않습니다. 아래 후보를 참고해 정확한 예약자 이름을 다시 입력해주세요.`,
    ...lines.map((line) => `- ${line}`),
  ].join("\n");
}

export const MEMBER_LOOKUP_QUERY_PAYLOAD_KEY = "_memberLookupQuery";
export const MEMBER_LOOKUP_CANDIDATES_PAYLOAD_KEY = "_memberLookupCandidates";

export function attachMemberLookupHintsToPayload(
  payload: Record<string, unknown>,
  resolution: Extract<MemberLookupResolution, { status: "ambiguous" }>,
): Record<string, unknown> {
  return {
    ...payload,
    [MEMBER_LOOKUP_QUERY_PAYLOAD_KEY]: resolution.query,
    [MEMBER_LOOKUP_CANDIDATES_PAYLOAD_KEY]: resolution.candidates.map(
      ({ memberId, name, nickname, score }) => ({
        memberId,
        name,
        nickname,
        score,
      }),
    ),
  };
}

export function stripMemberLookupHintsFromPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...payload };
  delete next[MEMBER_LOOKUP_QUERY_PAYLOAD_KEY];
  delete next[MEMBER_LOOKUP_CANDIDATES_PAYLOAD_KEY];
  return next;
}
