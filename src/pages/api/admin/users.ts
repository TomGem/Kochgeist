import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { users } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const allUsers = db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .all();

  return new Response(JSON.stringify(allUsers), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const formData = await request.formData();
  const userId = formData.get('userId') as string;
  const action = formData.get('action') as string;

  if (!userId || !action) {
    return new Response('Missing fields', { status: 400 });
  }

  // Prevent admin from demoting themselves
  if (userId === locals.user.id && action === 'demote') {
    return new Response('Cannot demote yourself', { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  switch (action) {
    case 'promote':
      updates.role = 'admin';
      break;
    case 'demote':
      updates.role = 'user';
      break;
    case 'verify':
      updates.isVerified = 1;
      break;
    default:
      return new Response('Invalid action', { status: 400 });
  }

  db.update(users).set(updates).where(eq(users.id, userId)).run();

  return new Response('Updated', { status: 200 });
};
