import { db } from '../../db/index';
import { sessions, users } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { generateSessionId } from './tokens';
import type { AstroCookies } from 'astro';

export const SESSION_COOKIE = 'kochgeist-session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId: string): string {
  const id = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  db.insert(sessions).values({ id, userId, expiresAt }).run();
  return id;
}

export function validateSession(sessionId: string) {
  const row = db
    .select({
      sessionId: sessions.id,
      sessionExpiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isVerified: users.isVerified,
      language: users.language,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .get();

  if (!row) return null;

  return {
    user: {
      id: row.userId,
      email: row.email,
      displayName: row.displayName,
      role: row.role as 'admin' | 'user',
      isVerified: row.isVerified,
      language: row.language,
    },
    session: {
      id: row.sessionId,
      expiresAt: row.sessionExpiresAt,
    },
  };
}

export function invalidateSession(sessionId: string): void {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export function invalidateAllSessions(userId: string): void {
  db.delete(sessions).where(eq(sessions.userId, userId)).run();
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string): void {
  const isSecure = (process.env.APP_URL || '').startsWith('https://');
  cookies.set(SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
}

export function deleteSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
