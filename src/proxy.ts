import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'sachar_session';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];
const PUBLIC_API_PREFIXES = ['/api/auth/'];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return redirectOrUnauthorized(req);

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return redirectOrUnauthorized(req);
  }
}

function redirectOrUnauthorized(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
