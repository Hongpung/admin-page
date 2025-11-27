import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const EXTEND_SECONDS = 60 * 60;
const COOKIE_SECURE = process.env.NODE_ENV === "production";

export async function POST(): Promise<Response> {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;
  const adminUser = cookieStore.get("admin_user")?.value;

  if (!token) {
    return Response.json({ message: "인증 정보가 없습니다." }, { status: 401 });
  }

  const response = await fetch(
    `${process.env.BASE_URL}/auth/admin/extend-token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    return Response.json(
      { message: body.message ?? "로그인 연장에 실패했습니다." },
      { status: response.status }
    );
  }

  const body = (await response.json()) as { token?: string };
  const nextToken = body.token;

  if (!nextToken) {
    return Response.json(
      { message: "로그인 연장 응답이 올바르지 않습니다." },
      { status: 502 }
    );
  }

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `token=${nextToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${EXTEND_SECONDS}${
      COOKIE_SECURE ? "; Secure" : ""
    }`
  );
  if (adminUser) {
    headers.append(
      "Set-Cookie",
      `admin_user=${encodeURIComponent(
        adminUser
      )}; Path=/; Max-Age=${EXTEND_SECONDS}; SameSite=Strict`
    );
  }

  return Response.json(
    {
      message: "로그인이 60분 연장되었습니다.",
      expiresInSeconds: EXTEND_SECONDS,
    },
    { headers }
  );
}
