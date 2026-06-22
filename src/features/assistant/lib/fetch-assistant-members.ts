import "server-only";

function requireBaseUrl(): string {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL is not configured");
  }
  return baseUrl;
}

export type AssistantMemberSearchItem = {
  memberId: number;
  name: string;
  nickname?: string | null;
  club?: string;
  enrollmentNumber?: string;
  role?: string[];
  email?: string;
};

export type AssistantMemberSearchResult = {
  members: AssistantMemberSearchItem[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

function normalizeMember(item: unknown): AssistantMemberSearchItem | null {
  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;
  const memberId = record.memberId;
  const name = record.name;

  if (
    typeof memberId !== "number" ||
    !Number.isInteger(memberId) ||
    memberId <= 0 ||
    typeof name !== "string" ||
    !name.trim()
  ) {
    return null;
  }

  return {
    memberId,
    name: name.trim(),
    nickname:
      typeof record.nickname === "string" ? record.nickname.trim() : null,
    club: typeof record.club === "string" ? record.club.trim() : undefined,
    enrollmentNumber:
      typeof record.enrollmentNumber === "string"
        ? record.enrollmentNumber.trim()
        : undefined,
    role: Array.isArray(record.role)
      ? record.role.filter((value): value is string => typeof value === "string")
      : undefined,
    email: typeof record.email === "string" ? record.email.trim() : undefined,
  };
}

function parseMemberSearchPayload(payload: unknown): AssistantMemberSearchResult {
  if (Array.isArray(payload)) {
    const members = payload
      .map(normalizeMember)
      .filter((item): item is AssistantMemberSearchItem => item !== null);

    return {
      members,
      totalCount: members.length,
      totalPages: members.length > 0 ? 1 : 0,
      page: 0,
      pageSize: members.length || 20,
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      members: [],
      totalCount: 0,
      totalPages: 0,
      page: 0,
      pageSize: 20,
    };
  }

  const record = payload as Record<string, unknown>;
  const rawMembers = Array.isArray(record.members) ? record.members : [];
  const members = rawMembers
    .map(normalizeMember)
    .filter((item): item is AssistantMemberSearchItem => item !== null);

  const totalCount =
    typeof record.totalCount === "number"
      ? record.totalCount
      : typeof record.total === "number"
        ? record.total
        : members.length;
  const page = typeof record.page === "number" ? record.page : 0;
  const pageSize = typeof record.pageSize === "number" ? record.pageSize : 20;
  const totalPages =
    typeof record.totalPages === "number"
      ? record.totalPages
      : pageSize > 0
        ? Math.ceil(totalCount / pageSize)
        : 0;

  return {
    members,
    totalCount,
    totalPages,
    page,
    pageSize,
  };
}

export async function fetchAssistantMemberSearch(
  token: string,
  params: {
    username?: string;
    clubId?: number;
    role?: string;
    page?: number;
    pageSize?: number;
  },
): Promise<AssistantMemberSearchResult> {
  const query = new URLSearchParams();
  if (params.username?.trim()) {
    query.set("username", params.username.trim());
  }
  if (params.clubId !== undefined) {
    query.set("clubId", String(params.clubId));
  }
  if (params.role?.trim()) {
    query.set("role", params.role.trim());
  }
  query.set("page", String(params.page ?? 0));
  query.set("pageSize", String(params.pageSize ?? 20));

  const response = await fetch(
    `${requireBaseUrl()}/member/search-user?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("회원 검색에 실패했습니다.");
  }

  const payload: unknown = await response.json();
  return parseMemberSearchPayload(payload);
}
