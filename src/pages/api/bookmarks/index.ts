import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { bookmarks, recipes } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { t, type Locale } from '../../../lib/i18n/index';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  }

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
    .where(eq(bookmarks.userId, locals.user.id))
    .all();

  return new Response(JSON.stringify(allBookmarks), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const recipeId = formData.get('recipeId') as string;

  if (!recipeId) {
    return new Response('Missing recipeId', { status: 400 });
  }

  const userId = locals.user.id;
  const lang = (locals.lang ?? 'en') as Locale;

  // Toggle: if already bookmarked by this user, remove it; otherwise add it
  const existing = db.select().from(bookmarks).where(and(eq(bookmarks.recipeId, recipeId), eq(bookmarks.userId, userId))).get();

  if (existing) {
    db.delete(bookmarks).where(and(eq(bookmarks.recipeId, recipeId), eq(bookmarks.userId, userId))).run();
    return new Response(
      `<button
        id="bookmark-${recipeId}"
        class="flex items-center lg:gap-3 bg-surface-container-highest p-2.5 lg:px-6 lg:py-3 rounded-full text-on-surface font-bold text-xs lg:text-sm transition-all active:scale-95"
        hx-post="/api/bookmarks"
        hx-vals='{"recipeId": "${recipeId}"}'
        hx-target="#bookmark-${recipeId}"
        hx-swap="outerHTML"
      >
        <span class="material-symbols-outlined text-lg lg:text-2xl">bookmark</span>
        <span class="hidden lg:inline">${t('detail.save', lang)}</span>
      </button>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  } else {
    db.insert(bookmarks).values({ recipeId, userId }).run();
    return new Response(
      `<button
        id="bookmark-${recipeId}"
        class="flex items-center lg:gap-3 bg-surface-container-highest p-2.5 lg:px-6 lg:py-3 rounded-full text-on-surface font-bold text-xs lg:text-sm transition-all active:scale-95"
        hx-post="/api/bookmarks"
        hx-vals='{"recipeId": "${recipeId}"}'
        hx-target="#bookmark-${recipeId}"
        hx-swap="outerHTML"
      >
        <span class="material-symbols-outlined text-lg lg:text-2xl" style="font-variation-settings: 'FILL' 1;">bookmark</span>
        <span class="hidden lg:inline">${t('detail.saved', lang)}</span>
      </button>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
};
