import type { AssistantLookupResultEntry } from "@admin/features/assistant/lib/assistant-tool-catalog";

type MemberLookupItem = {
  memberId?: number;
  name?: string;
  nickname?: string | null;
  club?: string;
  role?: string[];
  enrollmentNumber?: string;
};

function formatMemberLine(member: MemberLookupItem): string {
  const name = member.name?.trim() || "이름 없음";
  const memberId =
    typeof member.memberId === "number" ? ` (memberId ${member.memberId})` : "";
  const club = member.club?.trim();
  const nickname = member.nickname?.trim();
  const role =
    Array.isArray(member.role) && member.role.length > 0
      ? member.role.join(", ")
      : "";
  const details = [club, nickname, role].filter(Boolean).join(" · ");
  return details
    ? `- ${name}${memberId} — ${details}`
    : `- ${name}${memberId}`;
}

export function buildMemberLookupSummary(
  toolResults: AssistantLookupResultEntry[],
): string | null {
  const entry = toolResults.find(
    (result) =>
      result.toolId === "members_search_lookup" && result.ok && result.data,
  );
  if (!entry?.data) return null;

  const members = entry.data.members;
  const totalCount =
    typeof entry.data.totalCount === "number"
      ? entry.data.totalCount
      : Array.isArray(members)
        ? members.length
        : 0;

  if (!Array.isArray(members)) {
    return null;
  }

  if (members.length === 0) {
    return "검색 조건에 맞는 회원이 없습니다.";
  }

  const lines = (members as MemberLookupItem[]).map(formatMemberLine);
  const page =
    typeof entry.data.page === "number" ? entry.data.page + 1 : undefined;
  const totalPages =
    typeof entry.data.totalPages === "number" ? entry.data.totalPages : undefined;
  const pageLabel =
    page && totalPages && totalPages > 1
      ? ` (${page}/${totalPages}페이지, 전체 ${totalCount}명)`
      : ` (전체 ${totalCount}명)`;

  return `회원 검색 결과${pageLabel}:\n${lines.join("\n")}`;
}
