import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { bookmarks, recipes } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  const allBookmarks = db
    .select({
      bookmarkId: bookmarks.id,
      recipeId: recipes.id,
      title: recipes.title,
      description: recipes.description,
      cookTime: recipes.cookTime,
      difficulty: recipes.difficulty,
      imageUrl: recipes.imageUrl,
      dietaryTags: recipes.dietaryTags,
      createdAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .innerJoin(recipes, eq(bookmarks.recipeId, recipes.id))
    .all();

  return new Response(JSON.stringify(allBookmarks), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const recipeId = formData.get('recipeId') as string;

  if (!recipeId) {
    return new Response('Missing recipeId', { status: 400 });
  }

  // Toggle: if already bookmarked, remove it; otherwise add it
  const existing = db.select().from(bookmarks).where(eq(bookmarks.recipeId, recipeId)).get();

  if (existing) {
    db.delete(bookmarks).where(eq(bookmarks.recipeId, recipeId)).run();
    // Return unbookmarked button
    return new Response(
      `<button
        id="bookmark-${recipeId}"
        class="flex items-center gap-3 bg-surface-container-highest px-6 py-3 rounded-full text-on-surface font-bold text-sm transition-all active:scale-95"
        hx-post="/api/bookmarks"
        hx-vals='{"recipeId": "${recipeId}"}'
        hx-target="#bookmark-${recipeId}"
        hx-swap="outerHTML"
      >
        <span class="material-symbols-outlined">bookmark</span>
        Save
      </button>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  } else {
    db.insert(bookmarks).values({ recipeId }).run();
    // Return bookmarked button
    return new Response(
      `<button
        id="bookmark-${recipeId}"
        class="flex items-center gap-3 bg-surface-container-highest px-6 py-3 rounded-full text-on-surface font-bold text-sm transition-all active:scale-95"
        hx-post="/api/bookmarks"
        hx-vals='{"recipeId": "${recipeId}"}'
        hx-target="#bookmark-${recipeId}"
        hx-swap="outerHTML"
      >
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bookmark</span>
        Saved
      </button>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
};
