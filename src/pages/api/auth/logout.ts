import type { APIRoute } from 'astro';
import { invalidateSession, deleteSessionCookie, SESSION_COOKIE } from '../../../lib/auth/session';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    invalidateSession(sessionId);
  }
  deleteSessionCookie(cookies);
  return redirect('/login');
};
