import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { bookmarks } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (isNaN(id)) return new Response('Invalid ID', { status: 400 });

  db.delete(bookmarks).where(eq(bookmarks.id, id)).run();
  return new Response(null, { status: 204 });
};
