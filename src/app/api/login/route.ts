import { decodeJwtPayload, pickAdminRole } from "@admin/shared/lib/auth/admin-auth";

const COOKIE_MAX_AGE = 60 * 60;
const COOKIE_SECURE = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const response = await fetch(`${process.env.SUB_API}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const { message } = await response.json();
      throw Error(
        "Response Error from sever" + ` (${response.status}) :` + message
      );
    }

    const { token } = await response.json();

    const decodedToken = decodeJwtPayload(token);
    const roleStr = pickAdminRole(decodedToken) ?? "";

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${COOKIE_MAX_AGE}${COOKIE_SECURE ? "; Secure" : ""}`
    );
    headers.append(
      "Set-Cookie",
      `admin_user=${encodeURIComponent(
        email
      )}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Strict`
    );
    headers.append(
      "Set-Cookie",
      `role=${encodeURIComponent(
        roleStr
      )}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Strict; HttpOnly${COOKIE_SECURE ? "; Secure" : ""}`
    );

    return Response.json({ message: "success" }, { headers });
  } catch (e) {
    console.error(e);
    if (e instanceof Error)
      if (e.message == "Is not Valid")
        return new Response(`Error :${e.message}`, { status: 403 });
    return new Response(`Error :${e}`, { status: 400 });
  }
}
