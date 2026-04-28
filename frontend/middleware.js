import { NextResponse } from 'next/server';

const ROLE_ROUTES = {
  super_admin: '/super-admin',
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
};

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const token = request.cookies.get('sk_access')?.value ||
                request.cookies.get('sk_refresh')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const role = payload.role;
    const expected = ROLE_ROUTES[role];
    const isWrongDashboard = Object.values(ROLE_ROUTES).some(
      r => pathname.startsWith(r) && !pathname.startsWith(expected)
    );
    if (isWrongDashboard) {
      return NextResponse.redirect(new URL(expected, request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|quiz).*)'],
};