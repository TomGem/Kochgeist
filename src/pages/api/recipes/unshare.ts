import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { recipes } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { t, type Locale } from '../../../lib/i18n/index';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(str: string): string {
  return escapeHtml(str);
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const recipeId = formData.get('recipeId') as string;

  if (!recipeId) {
    return new Response('Missing recipeId', { status: 400 });
  }

  const lang = (locals.lang ?? 'en') as Locale;

  const recipe = db.select().from(recipes).where(eq(recipes.id, recipeId)).get();
  if (!recipe) {
    return new Response('Recipe not found', { status: 404 });
  }

  // Only the user who shared it or an admin can unshare
  if (recipe.sharedBy !== locals.user.id && locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  db.update(recipes)
    .set({ sharedAt: null, sharedBy: null })
    .where(eq(recipes.id, recipeId))
    .run();

  const shareLabel = t('detail.share', lang);
  const successLabel = t('detail.unshareSuccess', lang);

  return new Response(
    `<span id="share-${escapeAttr(recipeId)}"
      x-init="$store.ui.toastMessage = '${escapeAttr(successLabel)}'; setTimeout(() => $store.ui.toastMessage = null, 2000);"
    ><button
        class="flex items-center lg:gap-3 bg-surface-container-highest p-2.5 lg:px-6 lg:py-3 rounded-full text-on-surface font-bold text-xs lg:text-sm transition-all active:scale-95"
        hx-post="/api/recipes/share"
        hx-vals='${escapeAttr(JSON.stringify({ recipeId }))}'
        hx-target="#share-${escapeAttr(recipeId)}"
        hx-swap="outerHTML"
      >
        <span class="material-symbols-outlined text-lg lg:text-2xl">share</span>
        <span class="hidden lg:inline">${escapeHtml(shareLabel)}</span>
      </button></span>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
};
