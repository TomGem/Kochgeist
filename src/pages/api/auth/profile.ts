import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, hashPassword } from '../../../lib/auth/password';

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const displayName = formData.get('displayName') as string | null;
  const language = formData.get('language') as string | null;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (displayName !== null) updates.displayName = displayName.trim() || null;
  if (language !== null) updates.language = language;

  db.update(users).set(updates).where(eq(users.id, locals.user.id)).run();

  return new Response('Profile updated', { status: 200 });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const currentPassword = formData.get('currentPassword') as string || '';
  const newPassword = formData.get('newPassword') as string || '';

  if (!currentPassword || !newPassword) {
    return new Response('Missing fields', { status: 400 });
  }

  if (newPassword.length < 8) {
    return new Response('Password too short', { status: 400 });
  }

  const user = db.select().from(users).where(eq(users.id, locals.user.id)).get();
  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return new Response('Current password is incorrect', { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, locals.user.id)).run();

  return new Response('Password changed', { status: 200 });
};
