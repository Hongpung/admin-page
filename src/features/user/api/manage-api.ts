import type {
  MemberDetailResDto,
  MemberSearchPaginatedResDto,
  UpdateMemberByAdminReqDto,
} from "../types";
import { buildManageUserQueryString } from "../lib/manage-user-query";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: unknown };
    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }
  } catch {
    // noop
  }
  return response.statusText || `HTTP ${response.status}`;
}

export async function fetchUserData({
  username,
  clubId,
  role,
  page,
  pageSize,
}: {
  username?: string;
  clubId?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}): Promise<MemberSearchPaginatedResDto> {
  const queryString = buildManageUserQueryString({
    username,
    clubId,
    role,
    page,
    pageSize,
  });
  const response = await fetch(`/api/user/manage?${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data: MemberSearchPaginatedResDto = await response.json();
  return data;
}

export async function deleteUser(memberId: number, password: string) {
  try {
    const response = await fetch("/api/user/manage", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ memberId, password }),
    });

    if (!response.ok) throw Error(await readErrorMessage(response));
    return true;
  } catch {
    return false;
  }
}

export async function updateMemberByAdmin(
  memberId: number,
  payload: UpdateMemberByAdminReqDto,
): Promise<MemberDetailResDto> {
  const response = await fetch(`/api/user/manage/${memberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as MemberDetailResDto;
}
