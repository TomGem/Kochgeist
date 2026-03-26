import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { bookmarks } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const id = Number(params.id);
  if (isNaN(id)) return new Response('Invalid ID', { status: 400 });

  // Verify ownership
  const bookmark = db.select().from(bookmarks).where(eq(bookmarks.id, id)).get();
  if (!bookmark || bookmark.userId !== locals.user.id) {
    return new Response('Not found', { status: 404 });
  }

  db.delete(bookmarks).where(eq(bookmarks.id, id)).run();
  return new Response(null, { status: 204 });
};
