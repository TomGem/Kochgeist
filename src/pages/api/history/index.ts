import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { searchHistory } from '../../../db/schema';
import { desc } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  const history = db
    .select()
    .from(searchHistory)
    .orderBy(desc(searchHistory.createdAt))
    .limit(10)
    .all();

  return new Response(JSON.stringify(history), {
    headers: { 'Content-Type': 'application/json' },
  });
};
