import { defineMiddleware, sequence } from 'astro:middleware';
import { detectLocale } from '../lib/i18n/index';
import { validateSession, SESSION_COOKIE } from '../lib/auth/session';
import { isFirstUser } from '../lib/auth/setup';

const languageMiddleware = defineMiddleware((context, next) => {
  const lang = detectLocale(context.request);
  context.locals.lang = lang;
  return next();
});

const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/',
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
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon')) {
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

  // Everything else requires authentication
  if (!context.locals.user) {
    if (pathname.startsWith('/api/')) {
      return new Response('Unauthorized', { status: 401 });
    }
    return context.redirect('/login');
  }

  // Admin-only routes
  if (isAdminPath(pathname) && context.locals.user.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return new Response('Forbidden', { status: 403 });
    }
    return context.redirect('/');
  }

  return next();
});

export const onRequest = sequence(languageMiddleware, authMiddleware);
