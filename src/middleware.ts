import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

const PUBLIC_PATH_PREFIXES = [
  '/_next',
  '/favicon.ico',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/test-rate-limit',
  '/api/tasks',
  '/api/verifications/webhook',
  '/api/payments/banks',
  '/tasks',
  '/login',
  '/register',
];

function getAuthToken(req: NextRequest): string | undefined {
  const fromNextCookies = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (fromNextCookies) return fromNextCookies;

  const rawCookie = req.headers.get('cookie') || req.headers.get('Cookie');
  if (rawCookie) {
    const match = rawCookie.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, public API endpoints, health check, login, register, marketplace, webhooks, banks list, and homepage
  if (pathname === '/' || PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Intercept protected dashboard and API paths
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    const token = getAuthToken(req);

    if (!token) {
      if (pathname.startsWith('/api')) {
        return applySecurityHeaders(
          NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 })
        );
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (pathname.startsWith('/api')) {
        return applySecurityHeaders(
          NextResponse.json({ success: false, error: 'Invalid or expired session token' }, { status: 401 })
        );
      }
      const loginUrl = new URL('/login', req.url);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const role = payload.role;

    // RBAC Route Verification
    if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard/user', req.url)));
    }
    if (pathname.startsWith('/dashboard/support') && role !== 'SUPPORT' && role !== 'ADMIN') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard/user', req.url)));
    }
    if (pathname.startsWith('/dashboard/advertiser') && role !== 'ADVERTISER' && role !== 'ADMIN') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard/user', req.url)));
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);

    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
