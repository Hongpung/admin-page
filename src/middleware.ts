import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import {
  decodeJwtPayload,
  pickAdminRole,
} from "@admin/shared/lib/auth/admin-auth";
import { isRoleAllowedPath } from "@admin/shared/lib/auth/role-path-policy";

const COOKIE_SECURE = process.env.NODE_ENV === "production";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value; // 쿠키에서 토큰을 가져옴
  const pathname = req.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api");

  if (pathname.startsWith("/logout")) {
    const response = NextResponse.redirect(new URL("/login", req.url));

    // 토큰/권한 쿠키는 로그인 시 Secure + HttpOnly로 저장되므로 동일 속성으로 만료시킨다.
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });
    response.cookies.set("role", "", {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });
    response.cookies.set("admin_user", "", {
      httpOnly: false,
      secure: false,
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });

    return response;
  }

  if (pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/verificationCode") ||
    pathname.startsWith("/banner") ||
    pathname.startsWith("/upload-image") ||
    pathname.startsWith("/user-info")
  )
    return NextResponse.next();

  if ((token === "invalid" || !token) && !pathname.startsWith("/login")) {
    if (isApiRoute) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("reason", "session-expired");
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/login") && token && token !== "invalid") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (token && token !== "invalid") {
    const role = pickAdminRole(decodeJwtPayload(token));
    const normalizedPath = isApiRoute
      ? pathname
          .replace(/^\/api\/user\/sub/, "/user/sub")
          .replace(/^\/api\/club\/sub/, "/club/sub")
          .replace(/^\/api\/user\/(accept|manage)/, "/user")
          .replace(/^\/api\/club\/super/, "/club/global")
          .replace(/^\/api\/club\/profile/, "/club/global/profile")
          .replace(/^\/api\/reservation/, "/reservation")
          .replace(/^\/api\/session/, "/session")
          .replace(/^\/api\/manage/, "/manage")
          .replace(/^\/api\/admin/, "/admin")
      : pathname;

    if (!isRoleAllowedPath(role, normalizedPath)) {
      if (isApiRoute) {
        return NextResponse.json(
          { message: "비정상 접근 로직입니다." },
          { status: 403 },
        );
      }
      const blockedUrl = new URL("/home", req.url);
      blockedUrl.searchParams.set("blocked", "1");
      return NextResponse.redirect(blockedUrl);
    }
  }

  // 토큰이 유효하면 요청을 통과시킴
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
