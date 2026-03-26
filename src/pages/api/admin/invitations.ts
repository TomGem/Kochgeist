import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { invitations } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateInviteCode } from '../../../lib/auth/tokens';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const all = db
    .select()
    .from(invitations)
    .orderBy(desc(invitations.createdAt))
    .all()
    .map((inv) => {
      const now = new Date();
      const exhausted = inv.useCount >= inv.maxUses;
      const expired = inv.expiresAt < now;
      const status = exhausted ? 'exhausted' : expired ? 'expired' : 'active';
      return { ...inv, status };
    });

  return new Response(JSON.stringify(all), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const formData = await request.formData();
  const maxUses = Math.max(1, Number(formData.get('maxUses')) || 1);
  const expiresAtRaw = formData.get('expiresAt') as string;

  const code = generateInviteCode();
  // Accept a date string; fall back to 7 days from now
  let expiresAt: Date;
  if (expiresAtRaw) {
    const parsed = new Date(expiresAtRaw + 'T23:59:59');
    if (isNaN(parsed.getTime())) {
      return new Response('Invalid expiration date', { status: 400 });
    }
    expiresAt = parsed;
  } else {
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  db.insert(invitations).values({
    code,
    createdBy: locals.user.id,
    maxUses,
    expiresAt,
  }).run();

  return new Response(JSON.stringify({ code, maxUses, expiresAt }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  if (isNaN(id)) return new Response('Invalid ID', { status: 400 });

  db.delete(invitations).where(eq(invitations.id, id)).run();
  return new Response(null, { status: 204 });
};
