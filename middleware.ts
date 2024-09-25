import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 토큰 검증 함수 (실제 토큰 검증 로직을 여기에 구현)
function validateToken(token: string | undefined) {
  return true; // 실제 검증 로직으로 교체
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value; // 쿠키에서 토큰을 가져옴
  const { pathname } = req.nextUrl;

  console.log(token)

  if (pathname.startsWith('/login')) {
    if (validateToken(token)) {
      return NextResponse.redirect(new URL("/home", pathname))
    }
    return NextResponse.next();
  }

  if (!validateToken(token)) {
    return NextResponse.rewrite(new URL("/login", pathname))
  }

  // 토큰이 유효하면 요청을 통과시킴
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};