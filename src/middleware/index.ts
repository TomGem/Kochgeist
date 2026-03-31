import 'dotenv/config';
import { defineMiddleware, sequence } from 'astro:middleware';
import { detectLocale } from '../lib/i18n/index';
import { validateSession, SESSION_COOKIE } from '../lib/auth/session';
import { isFirstUser } from '../lib/auth/setup';
import { db } from '../db/index';
import { recipes } from '../db/schema';
import { eq } from 'drizzle-orm';

const securityHeadersMiddleware = defineMiddleware(async (context, next) => {
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'");
  if ((process.env.APP_URL || '').startsWith('https://')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
});

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const csrfMiddleware = defineMiddleware((context, next) => {
  if (SAFE_METHODS.has(context.request.method)) return next();

  // Build set of allowed origins: request host, APP_URL, and X-Forwarded-* reconstructed origin
  const allowedOrigins = new Set([context.url.origin]);
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    allowedOrigins.add(new URL(appUrl).origin);
  }
  const fwdProto = context.request.headers.get('x-forwarded-proto');
  const fwdHost = context.request.headers.get('x-forwarded-host');
  if (fwdProto && fwdHost) {
    allowedOrigins.add(`${fwdProto}://${fwdHost}`);
  }

  // Check Origin header first, fall back to Referer
  const origin = context.request.headers.get('origin');
  if (origin) {
    if (!allowedOrigins.has(origin)) {
      return new Response('Forbidden', { status: 403 });
    }
    return next();
  }

  // No Origin header — check Referer as fallback
  const referer = context.request.headers.get('referer');
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!allowedOrigins.has(refererOrigin)) {
        return new Response('Forbidden', { status: 403 });
      }
      return next();
    } catch {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Neither Origin nor Referer present — reject for safety
  return new Response('Forbidden', { status: 403 });
});

const languageMiddleware = defineMiddleware((context, next) => {
  const lang = detectLocale(context.request, context.locals.user?.language);
  context.locals.lang = lang;
  return next();
});

const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/',
  '/feed',
  '/partials/feed-grid',
];

const ADMIN_PATHS = ['/admin', '/api/admin/'];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p));
}

const authMiddleware = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Default to no user
  context.locals.user = null;
  context.locals.session = null;

  // Skip auth for static assets
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon') || pathname === '/apple-touch-icon.png' || pathname.startsWith('/icon-') || pathname === '/site.webmanifest') {
    return next();
  }

  // First-user bootstrap: redirect to setup if no users exist
  if (isFirstUser()) {
    if (pathname === '/register' && context.url.searchParams.get('setup') === 'true') {
      return next();
    }
    if (pathname.startsWith('/api/auth/')) {
      return next();
    }
    return context.redirect('/register?setup=true');
  }

  // Validate session cookie
  const sessionId = context.cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const result = validateSession(sessionId);
    if (result) {
      context.locals.user = result.user;
      context.locals.session = result.session;
    }
  }

  // Auth pages (login, register, etc.) — always accessible
  if (isAuthPath(pathname)) {
    return next();
  }

  // Shared recipes are publicly accessible
  if (!context.locals.user && pathname.startsWith('/recipe/')) {
    const recipeId = pathname.replace('/recipe/', '');
    if (recipeId) {
      const recipe = db.select({ sharedAt: recipes.sharedAt }).from(recipes).where(eq(recipes.id, recipeId)).get();
      if (recipe?.sharedAt) {
        return next();
      }
    }
  }

  // Allow read-only image access without authentication
  if (pathname.startsWith('/api/images/')) {
    return next();
  }

  // Everything else requires authentication
  if (!context.locals.user) {
    if (pathname.startsWith('/api/')) {
      return new Response('Unauthorized', { status: 401 });
    }
    return context.redirect('/login');
  }

  // Admin-only routes (require admin role AND verified email)
  if (isAdminPath(pathname) && (context.locals.user.role !== 'admin' || !context.locals.user.isVerified)) {
    if (pathname.startsWith('/api/')) {
      return new Response('Forbidden', { status: 403 });
    }
    return context.redirect('/');
  }

  return next();
});

export const onRequest = sequence(securityHeadersMiddleware, csrfMiddleware, authMiddleware, languageMiddleware);
