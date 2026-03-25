import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { recipes } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return new Response('Missing ID', { status: 400 });

  const recipe = db.select().from(recipes).where(eq(recipes.id, id)).get();
  if (!recipe) return new Response('Not found', { status: 404 });

  return new Response(
    JSON.stringify({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      dietaryTags: recipe.dietaryTags ? JSON.parse(recipe.dietaryTags) : [],
      extraIngredients: recipe.extraIngredients ? JSON.parse(recipe.extraIngredients) : [],
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
