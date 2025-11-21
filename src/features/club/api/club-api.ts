import type {
  ClubInfo,
  ClubMember,
  ClubPrimaryMember,
  UpdateClubProfileRequest,
} from "../types";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: unknown };
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Ignore invalid or empty error response bodies.
  }

  return response.statusText || `HTTP ${response.status}`;
}

async function requestJson<T>({
  url,
  init,
  failureMessage,
}: {
  url: string;
  init: RequestInit;
  failureMessage: string;
}): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`${failureMessage}: ${await readErrorMessage(response)}`);
  }

  return response.json() as Promise<T>;
}

export async function getAllClubProfiles(): Promise<ClubInfo[]> {
  return requestJson<ClubInfo[]>({
    url: "/api/club/profile",
    init: {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    failureMessage: "동아리 목록 조회에 실패했습니다",
  });
}

export async function getSubClubProfile(): Promise<ClubInfo> {
  return requestJson<ClubInfo>({
    url: "/api/club/sub/profile",
    init: {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    failureMessage: "동아리 정보 조회에 실패했습니다",
  });
}

export async function searchMembers({
  username,
  clubId,
  role,
}: {
  username?: string;
  clubId?: string;
  role?: string;
}): Promise<{
  members: Array<{
    memberId: number;
    name: string;
    nickname: string;
    club: string;
    role: string[];
  }>;
}> {
  const params = new URLSearchParams();

  if (username?.trim()) {
    params.set("username", username.trim());
  }
  if (clubId) {
    params.set("clubId", clubId);
  }
  if (role) {
    params.set("role", role);
  }

  const queryString = params.toString();
  return requestJson({
    url: `/api/club/search-members${queryString ? `?${queryString}` : ""}`,
    init: {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    failureMessage: "멤버 검색에 실패했습니다",
  });
}

export async function updateClubProfile(
  clubId: number,
  data: UpdateClubProfileRequest,
): Promise<{ message: string }> {
  return requestJson({
    url: "/api/club/profile",
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clubId,
        ...data,
      }),
    },
    failureMessage: "동아리 프로필 수정에 실패했습니다",
  });
}

export async function updateSubClubProfile(
  data: UpdateClubProfileRequest,
): Promise<{ message: string }> {
  return requestJson({
    url: "/api/club/sub/profile",
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    failureMessage: "동아리 프로필 수정에 실패했습니다",
  });
}

export async function getClubMembersByClubId(
  clubId: number,
): Promise<ClubMember[]> {
  return requestJson({
    url: `/api/club/super/${clubId}/members`,
    init: {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
    failureMessage: "동아리 멤버 조회에 실패했습니다",
  });
}

export async function getClubMembersBySubAdmin(): Promise<ClubMember[]> {
  return requestJson({
    url: "/api/club/sub/members",
    init: {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
    failureMessage: "동아리 멤버 조회에 실패했습니다",
  });
}

export async function getClubPrimaryMembersByClubId(
  clubId: number,
): Promise<ClubPrimaryMember[]> {
  return requestJson({
    url: `/api/club/super/${clubId}/primary-members`,
    init: {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
    failureMessage: "주요 멤버 조회에 실패했습니다",
  });
}

export async function updateClubPrimaryMembers(
  clubId: number,
  memberIds: number[],
): Promise<{ message: string }> {
  return requestJson({
    url: `/api/club/super/${clubId}/primary-members`,
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberIds }),
    },
    failureMessage: "주요 멤버 수정에 실패했습니다",
  });
}

export async function getSubClubPrimaryMembers(): Promise<ClubPrimaryMember[]> {
  return requestJson({
    url: "/api/club/sub/primary-members",
    init: {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
    failureMessage: "주요 멤버 조회에 실패했습니다",
  });
}

export async function updateSubClubPrimaryMembers(
  memberIds: number[],
): Promise<{ message: string }> {
  return requestJson({
    url: "/api/club/sub/primary-members",
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberIds }),
    },
    failureMessage: "주요 멤버 수정에 실패했습니다",
  });
}

export async function uploadImage(formData: FormData) {
  const res = await fetch("/api/upload-s3", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) return null;
  const { imageURL } = (await res.json()) as { imageURL?: string };

  return imageURL ?? null;
}
