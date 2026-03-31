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

  const shareUrl = `${url.origin}/recipe/${encodeURIComponent(recipeId)}`;
  const successLabel = t('detail.shareSuccess', lang);
  const copyLabel = t('detail.copyLink', lang);
  const copiedLabel = t('detail.linkCopied', lang);

  return new Response(
    `<button
      id="share-${escapeAttr(recipeId)}"
      class="flex items-center gap-1.5 sm:gap-3 bg-surface-container-highest px-3 sm:px-6 py-2 sm:py-3 rounded-full text-on-surface font-bold text-xs sm:text-sm transition-all active:scale-95"
      x-data
      data-share-url="${escapeAttr(shareUrl)}"
      data-success-label="${escapeAttr(successLabel)}"
      data-copied-label="${escapeAttr(copiedLabel)}"
      x-init="navigator.clipboard.writeText($el.dataset.shareUrl).then(() => { $store.ui.toastMessage = $el.dataset.successLabel; setTimeout(() => $store.ui.toastMessage = null, 2000); })"
      x-on:click="navigator.clipboard.writeText($el.dataset.shareUrl).then(() => { $store.ui.toastMessage = $el.dataset.copiedLabel; setTimeout(() => $store.ui.toastMessage = null, 2000); })"
    >
      <span class="material-symbols-outlined text-lg sm:text-2xl">link</span>
      ${escapeHtml(copyLabel)}
    </button>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
};
