import type { APIRoute } from 'astro';
import { generateImageForRecipe } from '../../../lib/images/queue';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const recipeId = formData.get('recipeId') as string;

  if (!recipeId) {
    return new Response('Missing recipeId', { status: 400 });
  }

  // Fire and forget - generate in background
  generateImageForRecipe(recipeId).catch((err) =>
    console.error('Background image generation failed:', err),
  );

  return new Response(JSON.stringify({ status: 'generating', recipeId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
