import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { imageCache } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';

export const GET: APIRoute = async ({ params }) => {
  const recipeId = params.id;
  if (!recipeId) return new Response('Missing ID', { status: 400 });

  const cached = db.select().from(imageCache).where(eq(imageCache.recipeId, recipeId)).get();

  if (!cached || cached.status !== 'ready' || !cached.filePath) {
    // Return status JSON if not ready
    return new Response(
      JSON.stringify({ status: cached?.status || 'pending' }),
      { headers: { 'Content-Type': 'application/json' }, status: 202 },
    );
  }

  if (!existsSync(cached.filePath)) {
    return new Response('Image file not found', { status: 404 });
  }

  const imageData = readFileSync(cached.filePath);
  const ext = cached.filePath.endsWith('.png') ? 'image/png' : 'image/webp';

  return new Response(imageData, {
    headers: {
      'Content-Type': ext,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
