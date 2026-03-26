import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { searchHistory } from '../../../db/schema';
import { desc, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  }

  const history = db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.userId, locals.user.id))
    .orderBy(desc(searchHistory.createdAt))
    .limit(10)
    .all();

  return new Response(JSON.stringify(history), {
    headers: { 'Content-Type': 'application/json' },
  });
};
