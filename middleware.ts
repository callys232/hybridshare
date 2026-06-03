import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars';

// Routes that do not require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/privacy', '/terms', '/pricing', '/features'];

// API prefixes that are public (no token required)
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/share/', '/api/billing/plans', '/api/webhooks/', '/api/uploads/'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;
  return pathname.startsWith('/_next/') || pathname.startsWith('/favicon');
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function verifyJwtSync(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, body, providedSig] = parts;
    const expectedSig = createHmac('sha256', SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    const a = Buffer.from(expectedSig);
    const b = Buffer.from(providedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { exp?: number };
    return (payload.exp ?? 0) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();
  if (pathname.startsWith('/api/') && isPublicApi(pathname)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.next(); // API routes self-validate Bearer tokens

  const sessionToken = request.cookies.get('hs_session')?.value;

  if (!sessionToken || !verifyJwtSync(sessionToken)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('hs_session');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
