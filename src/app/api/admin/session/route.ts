import { cookies } from "next/headers";
import type { AdminLevel, AdminSessionRes } from "@admin/features/admin/types";
import {
  decodeJwtPayload,
  pickAdminRole,
  pickExpiresInSeconds,
  pickMemberId,
} from "@admin/shared/lib/auth/admin-auth";

export async function GET(): Promise<Response> {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return Response.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const payload = decodeJwtPayload(token);
  const body: AdminSessionRes = {
    memberId: payload ? pickMemberId(payload) : null,
    adminLevel: (payload ? pickAdminRole(payload) : null) as AdminLevel | null,
    expiresInSeconds: payload ? pickExpiresInSeconds(payload) : 0,
  };

  return Response.json(body);
}
