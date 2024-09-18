import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 토큰 검증 함수 (실제 토큰 검증 로직을 여기에 구현)
function validateToken(token: string | undefined) {
  return token === "valid-token"; // 실제 검증 로직으로 교체
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value; // 쿠키에서 토큰을 가져옴
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/login')) {
    // 2. 토큰이 유효하면 로그인 페이지 접근 못하게 리다이렉트
    if (validateToken(token)) {
      return NextResponse.redirect(new URL('/dashboard', req.url)); // 이미 로그인한 경우 루트 페이지로 리다이렉트
    }
    return NextResponse.next(); // 로그인 페이지는 토큰이 없으면 그대로 접근 허용
  }

  // 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
  if (!validateToken(token)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 토큰이 유효하면 요청을 통과시킴
  return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: ['/protected/:path*'], // 보호할 경로를 설정
};
