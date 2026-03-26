import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { imageCache } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { resolve, normalize } from 'path';

const IMAGE_DIR = resolve('./data/images');

export const GET: APIRoute = async ({ params }) => {
  const recipeId = params.id;
  if (!recipeId || !/^[\w-]+$/.test(recipeId)) {
    return new Response('Invalid ID', { status: 400 });
  }

  const cached = db.select().from(imageCache).where(eq(imageCache.recipeId, recipeId)).get();

  if (!cached || cached.status !== 'ready' || !cached.filePath) {
    return new Response(
      JSON.stringify({ status: cached?.status || 'pending' }),
      { headers: { 'Content-Type': 'application/json' }, status: 202 },
    );
  }

  // Validate file path is within expected directory
  const resolvedPath = resolve(normalize(cached.filePath));
  if (!resolvedPath.startsWith(IMAGE_DIR)) {
    return new Response('Invalid image path', { status: 403 });
  }

  if (!existsSync(resolvedPath)) {
    return new Response('Image file not found', { status: 404 });
  }

  const imageData = readFileSync(resolvedPath);
  const contentType = resolvedPath.endsWith('.png') ? 'image/png' : 'image/webp';

  return new Response(imageData, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
