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

export const POST: APIRoute = async ({ request, locals, url }) => {
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

  // Mark as shared if not already
  if (!recipe.sharedAt) {
    db.update(recipes)
      .set({ sharedAt: new Date(), sharedBy: locals.user.id })
      .where(eq(recipes.id, recipeId))
      .run();
  }

  const baseUrl = (process.env.APP_URL || url.origin).replace(/\/+$/, '');
  const shareUrl = `${baseUrl}/recipe/${encodeURIComponent(recipeId)}`;
  const successLabel = t('detail.shareSuccess', lang);
  const copyLabel = t('detail.copyLink', lang);
  const copiedLabel = t('detail.linkCopied', lang);
  const unshareLabel = t('detail.unshare', lang);

  return new Response(
    `<span id="share-${escapeAttr(recipeId)}" class="flex gap-2 lg:gap-4"
      x-data
      x-init="navigator.clipboard.writeText('${escapeAttr(shareUrl)}').then(() => { $store.ui.toastMessage = '${escapeAttr(successLabel)}'; setTimeout(() => $store.ui.toastMessage = null, 2000); })"
    ><button
        class="flex items-center lg:gap-3 bg-surface-container-highest p-2.5 lg:px-6 lg:py-3 rounded-full text-on-surface font-bold text-xs lg:text-sm transition-all active:scale-95"
        x-data="{ copied: false }"
        x-on:click="navigator.clipboard.writeText('${escapeAttr(shareUrl)}').then(() => { copied = true; $store.ui.toastMessage = '${escapeAttr(copiedLabel)}'; setTimeout(() => { $store.ui.toastMessage = null; copied = false; }, 2000); })"
      >
        <span class="material-symbols-outlined text-lg lg:text-2xl" x-text="copied ? 'check' : 'link'">link</span>
        <span class="hidden lg:inline" x-text="copied ? '${escapeAttr(copiedLabel)}' : '${escapeAttr(copyLabel)}'">${escapeHtml(copyLabel)}</span>
      </button><button
        class="flex items-center lg:gap-3 bg-surface-container-highest p-2.5 lg:px-6 lg:py-3 rounded-full text-on-surface font-bold text-xs lg:text-sm transition-all active:scale-95"
        hx-post="/api/recipes/unshare"
        hx-vals='${escapeAttr(JSON.stringify({ recipeId }))}'
        hx-target="#share-${escapeAttr(recipeId)}"
        hx-swap="outerHTML"
      >
        <span class="material-symbols-outlined text-lg lg:text-2xl">visibility_off</span>
        <span class="hidden lg:inline">${escapeHtml(unshareLabel)}</span>
      </button></span>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
};
