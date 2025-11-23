import type {
  AdminLevel,
  AdminListRes,
  AdminMutationRes,
  AdminSessionRes,
} from "../types";

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    if (typeof data?.message === "string") return data.message;
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function fetchAdminSession(): Promise<AdminSessionRes> {
  const res = await fetch("/api/admin/session", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<AdminSessionRes>(res);
}

export async function fetchAdminList(): Promise<AdminListRes> {
  const res = await fetch("/api/admin", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<AdminListRes>(res);
}

export async function grantAdmin(
  memberId: number,
  adminLevel: AdminLevel,
): Promise<AdminMutationRes> {
  const res = await fetch(`/api/admin/${memberId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ adminLevel }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<AdminMutationRes>(res);
}

export async function changeAdminLevel(
  memberId: number,
  adminLevel: AdminLevel,
): Promise<AdminMutationRes> {
  const res = await fetch(`/api/admin/change/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ adminLevel }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<AdminMutationRes>(res);
}

export async function revokeAdmin(memberId: number): Promise<AdminMutationRes> {
  const res = await fetch(`/api/admin/delete/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return parseJson<AdminMutationRes>(res);
}
