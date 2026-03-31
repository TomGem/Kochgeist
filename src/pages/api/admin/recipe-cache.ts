import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { recipeCache, recipes } from '../../../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const entries = db
    .select()
    .from(recipeCache)
    .orderBy(desc(recipeCache.createdAt))
    .all();

  // Collect all recipe IDs to fetch titles in bulk
  const allRecipeIds = new Set<string>();
  for (const entry of entries) {
    const ids: string[] = JSON.parse(entry.recipeIds);
    for (const id of ids) allRecipeIds.add(id);
  }

  const recipeTitles: Record<string, string> = {};
  if (allRecipeIds.size > 0) {
    const recipeRows = db
      .select({ id: recipes.id, title: recipes.title })
      .from(recipes)
      .where(inArray(recipes.id, [...allRecipeIds]))
      .all();
    for (const r of recipeRows) recipeTitles[r.id] = r.title;
  }

  const result = entries.map((entry) => {
    const recipeIds: string[] = JSON.parse(entry.recipeIds);
    return {
      id: entry.id,
      ingredients: JSON.parse(entry.ingredientsRaw) as string[],
      language: entry.language,
      dietaryFilters: entry.dietaryFilters ? JSON.parse(entry.dietaryFilters) as string[] : [],
      recipeCount: recipeIds.length,
      recipeTitles: recipeIds.map((id) => recipeTitles[id] || id),
      createdAt: entry.createdAt.toISOString(),
    };
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const formData = await request.formData();
  const idRaw = formData.get('id');

  if (idRaw === 'all') {
    db.delete(recipeCache).run();
  } else {
    const id = Number(idRaw);
    if (isNaN(id)) return new Response('Invalid ID', { status: 400 });
    db.delete(recipeCache).where(eq(recipeCache.id, id)).run();
  }

  return new Response(null, { status: 204 });
};
