import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';


export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value; // 쿠키에서 토큰을 가져옴
  const url = req.nextUrl.pathname;


  if (url.startsWith('/verificationCode') || url.startsWith('/banners'))
    return NextResponse.next();

  if ((token === 'invalid' || !(token)) && !url.startsWith('/login')) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (url.startsWith('/login') && token) {
    return NextResponse.redirect(new URL("/home", req.url))
  }

  if (req.nextUrl.pathname.startsWith('/logout') && token) {

    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.set('token', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      path: '/',
      expires: new Date(0)
    });
    return response;
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