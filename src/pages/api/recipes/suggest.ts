import type { APIRoute } from 'astro';
import { db } from '../../../db/index';
import { recipes, recipeCache, searchHistory } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getAIProvider } from '../../../lib/ai/registry';
import type { CookingTip } from '../../../lib/ai/provider';
import { computeIngredientHash } from '../../../lib/cache';
import { generateImageForRecipe } from '../../../lib/images/queue';
import { t, type Locale } from '../../../lib/i18n/index';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const ingredientsRaw = formData.get('ingredients') as string;
    const filtersRaw = formData.get('filters') as string;
    const lang = (formData.get('lang') as Locale) || 'en';

    const surpriseMe = formData.get('surpriseMe') === 'true';

    if (!ingredientsRaw && !surpriseMe) {
      return new Response('Missing ingredients', { status: 400 });
    }

    const ingredients: string[] = ingredientsRaw ? JSON.parse(ingredientsRaw) : [];
    const filters: string[] = filtersRaw ? JSON.parse(filtersRaw) : [];

    if (ingredients.length === 0 && !surpriseMe) {
      return new Response('No ingredients provided', { status: 400 });
    }

    // Resolve provider before cache check (needed for cache key)
    const provider = await getAIProvider();

    // Check cache (includes provider+model so switching models produces fresh results)
    const hash = computeIngredientHash(ingredients, lang, filters, provider.name, provider.model);
    const cached = db.select().from(recipeCache).where(eq(recipeCache.ingredientHash, hash)).get();

    let recipeIds: string[];
    let tip: CookingTip | undefined;

    if (cached) {
      recipeIds = JSON.parse(cached.recipeIds);
      tip = cached.tip ? JSON.parse(cached.tip) : undefined;
    } else {
      // Call AI with timing
      const start = Date.now();
      const aiResult = await provider.generateRecipes({
        ingredients,
        language: lang,
        dietaryFilters: filters,
      });
      const aiGenerationTimeMs = Date.now() - start;
      tip = aiResult.tip;

      // Store recipes in DB
      recipeIds = [];
      for (const recipe of aiResult.recipes) {
        const id = nanoid(12);
        recipeIds.push(id);
        db.insert(recipes).values({
          id,
          title: recipe.title,
          description: recipe.description,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
          highlight: recipe.highlight ?? null,
          servings: recipe.servings,
          ingredients: JSON.stringify(recipe.ingredients),
          instructions: JSON.stringify(recipe.instructions),
          language: lang,
          dietaryTags: filters.length > 0 ? JSON.stringify(filters) : null,
          extraIngredients: JSON.stringify(
            recipe.ingredients.filter((i) => i.isExtra).map((i) => i.name),
          ),
          imageUrl: null,
          imageStatus: 'pending',
          aiProvider: provider.name,
          aiModel: provider.model,
          aiGenerationTimeMs,
        }).run();
      }

      // Cache the result
      db.insert(recipeCache).values({
        ingredientHash: hash,
        ingredientsRaw: JSON.stringify(ingredients),
        language: lang,
        dietaryFilters: filters.length > 0 ? JSON.stringify(filters) : null,
        recipeIds: JSON.stringify(recipeIds),
        tip: tip ? JSON.stringify(tip) : null,
      }).run();

      // Trigger image generation in background for each recipe
      for (const id of recipeIds) {
        generateImageForRecipe(id).catch((err) =>
          console.error(`Image gen failed for ${id}:`, err),
        );
      }
    }

    // Save to search history (only for authenticated users)
    if (locals.user) {
      db.insert(searchHistory).values({
        ingredients: JSON.stringify(ingredients),
        ingredientHash: hash,
        userId: locals.user.id,
        language: lang,
        dietaryFilters: filters.length > 0 ? JSON.stringify(filters) : null,
      }).run();
    }

    // Fetch recipes from DB
    const recipeRows = recipeIds.map((id) =>
      db.select().from(recipes).where(eq(recipes.id, id)).get()
    ).filter(Boolean);

    // Build HTML partial response
    const recipeCards = recipeRows.map((r) => {
      const ingredientsList = JSON.parse(r!.ingredients) as unknown[];
      const extraList = r!.extraIngredients ? JSON.parse(r!.extraIngredients) as unknown[] : [];
      return {
        id: r!.id,
        title: r!.title,
        description: r!.description,
        cookTime: r!.cookTime,
        difficulty: r!.difficulty,
        imageUrl: r!.imageUrl,
        extraCount: extraList.length,
        totalIngredientCount: ingredientsList.length,
      };
    });

    // Return a redirect to the partial with recipe data stored in session
    // For htmx, we render the partial server-side
    const html = renderResultsPartial(ingredients, recipeCards, lang, tip, surpriseMe);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Recipe suggest error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      `<div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-16 h-16 bg-error-container/20 rounded-full flex items-center justify-center mb-4">
          <span class="material-symbols-outlined text-error text-3xl">error</span>
        </div>
        <h3 class="font-headline text-xl font-bold text-on-surface mb-2">Something went wrong</h3>
        <p class="text-on-surface-variant mb-4 max-w-md">${escapeHtml(message)}</p>
        <button onclick="history.back()" class="editorial-gradient text-on-primary px-6 py-3 rounded-full font-bold">
          Try Again
        </button>
      </div>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface RecipeCard {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  difficulty: string;
  imageUrl: string | null;
  extraCount: number;
  totalIngredientCount: number;
}

function renderResultsPartial(ingredients: string[], cards: RecipeCard[], lang: string, tip?: CookingTip, surpriseMe?: boolean): string {
  const ingredientText = ingredients.join(', ');

  // Pick the best-match recipe (fewest extras relative to total) as featured
  let bestIdx = 0;
  let bestRatio = Infinity;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const ratio = c.totalIngredientCount > 0 ? c.extraCount / c.totalIngredientCount : 1;
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestIdx = i;
    }
  }
  const sorted = [cards[bestIdx], ...cards.filter((_, i) => i !== bestIdx)];

  const featured = sorted[0];
  const vertical = sorted[1];
  const horiz1 = sorted[2];
  const horiz2 = sorted[3];

  function imgOrPlaceholder(card: RecipeCard, icon: string, gradientClasses: string, minHeight: string) {
    if (card.imageUrl) {
      return `<img alt="${escapeHtml(card.title)}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${minHeight}" src="${escapeHtml(card.imageUrl)}" />`;
    }
    return `<div
      id="image-slot-${card.id}"
      class="h-full w-full ${minHeight} ${gradientClasses} flex flex-col items-center justify-center gap-3"
    >
      <span class="material-symbols-outlined text-4xl text-primary/20 animate-pulse">${icon}</span>
      <div class="flex items-center gap-2 text-on-surface-variant/50">
        <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        <span class="text-[10px] font-bold uppercase tracking-widest">Generating image</span>
      </div>
    </div>`;
  }

  function cardClick(id: string) {
    return `hx-get="/partials/recipe-detail?id=${id}" hx-target="#recipe-modal" hx-swap="innerHTML"`;
  }

  const headerTitle = surpriseMe
    ? `<span class="text-primary italic">${escapeHtml(t('results.surpriseHeader', lang as Locale))}</span>`
    : `${escapeHtml(t('results.recipesFor', lang as Locale))} <span class="text-primary italic">${escapeHtml(ingredientText)}</span>`;
  const headerNote = surpriseMe
    ? escapeHtml(t('results.surpriseNote', lang as Locale))
    : escapeHtml(t('results.analysisNote', lang as Locale));

  return `
<!-- Results Header -->
<section class="mb-12">
  <div class="flex items-center gap-2 mb-2">
    <span class="font-label text-[10px] uppercase tracking-[0.05em] font-semibold text-primary">${escapeHtml(t('results.curatedResults', lang as Locale))}</span>
    <div class="h-[1px] flex-grow bg-outline-variant/20"></div>
  </div>
  <h1 class="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-tight mb-4">
    ${headerTitle}
  </h1>
  <p class="font-body text-on-surface-variant max-w-2xl leading-relaxed">
    ${headerNote}
  </p>
</section>

<!-- Bento Grid -->
<div class="grid grid-cols-1 md:grid-cols-12 gap-8">
  ${featured ? `
  <!-- Featured Card -->
  <article class="md:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container-lowest recipe-card-shadow transition-all duration-300 hover:-translate-y-1 cursor-pointer" ${cardClick(featured.id)}>
    <div class="flex flex-col md:flex-row h-full">
      <div class="md:w-1/2 relative overflow-hidden">
        ${imgOrPlaceholder(featured, 'restaurant', 'bg-gradient-to-br from-primary/20 to-tertiary-container/30', 'min-h-[240px]')}
        <div class="absolute top-4 left-4">
          <span class="editorial-gradient text-on-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">${escapeHtml(t('results.bestMatch', lang as Locale))}</span>
        </div>
      </div>
      <div class="md:w-1/2 p-8 flex flex-col justify-between">
        <div>
          <h3 class="font-headline text-2xl font-bold leading-tight text-on-surface mb-4">${escapeHtml(featured.title)}</h3>
          <p class="font-body text-on-surface-variant mb-6 leading-relaxed">${escapeHtml(featured.description)}</p>
        </div>
        <div class="flex gap-4">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-primary">timer</span>
            <span class="font-label text-[10px] font-bold">${escapeHtml(featured.cookTime)}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-secondary">eco</span>
            <span class="font-label text-[10px] font-bold">${escapeHtml(featured.difficulty).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  </article>` : ''}

  ${vertical ? `
  <!-- Vertical Card -->
  <article class="md:col-span-4 group flex flex-col rounded-xl bg-surface-container-lowest recipe-card-shadow transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer" ${cardClick(vertical.id)}>
    <div class="h-64 overflow-hidden relative">
      ${imgOrPlaceholder(vertical, 'soup_kitchen', 'bg-gradient-to-br from-secondary/20 to-tertiary-container/30', '')}
    </div>
    <div class="p-6 flex-grow flex flex-col justify-between">
      <div>
        <h3 class="font-headline text-xl font-bold text-on-surface mb-3">${escapeHtml(vertical.title)}</h3>
        <p class="font-body text-sm text-on-surface-variant mb-6">${escapeHtml(vertical.description)}</p>
      </div>
      <div class="flex gap-4">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[14px] text-primary">timer</span>
          <span class="font-label text-[10px] font-bold">${escapeHtml(vertical.cookTime)}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[14px] text-secondary">eco</span>
          <span class="font-label text-[10px] font-bold">${escapeHtml(vertical.difficulty).toUpperCase()}</span>
        </div>
      </div>
    </div>
  </article>` : ''}

  ${horiz1 ? `
  <!-- Horizontal Card 1 -->
  <article class="md:col-span-6 group overflow-hidden rounded-xl bg-surface-container-lowest recipe-card-shadow transition-all duration-300 hover:-translate-y-1 cursor-pointer" ${cardClick(horiz1.id)}>
    <div class="flex h-full">
      <div class="w-2/5 overflow-hidden">
        ${imgOrPlaceholder(horiz1, 'skillet', 'bg-gradient-to-br from-tertiary/20 to-primary-container/30', 'min-h-[180px]')}
      </div>
      <div class="w-3/5 p-6 flex flex-col justify-between">
        <div>
          <h3 class="font-headline text-lg font-bold text-on-surface mb-2">${escapeHtml(horiz1.title)}</h3>
          <p class="font-body text-sm text-on-surface-variant line-clamp-2">${escapeHtml(horiz1.description)}</p>
        </div>
        <div class="flex gap-4 mt-4">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-primary">timer</span>
            <span class="font-label text-[10px] font-bold">${escapeHtml(horiz1.cookTime)}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-secondary">eco</span>
            <span class="font-label text-[10px] font-bold">${escapeHtml(horiz1.difficulty).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  </article>` : ''}

  ${horiz2 ? `
  <!-- Horizontal Card 2 -->
  <article class="md:col-span-6 group overflow-hidden rounded-xl bg-surface-container-lowest recipe-card-shadow transition-all duration-300 hover:-translate-y-1 cursor-pointer" ${cardClick(horiz2.id)}>
    <div class="flex h-full">
      <div class="w-2/5 overflow-hidden">
        ${imgOrPlaceholder(horiz2, 'skillet', 'bg-gradient-to-br from-secondary/15 to-tertiary/15', 'min-h-[180px]')}
      </div>
      <div class="w-3/5 p-6 flex flex-col justify-between">
        <div>
          <h3 class="font-headline text-lg font-bold text-on-surface mb-2">${escapeHtml(horiz2.title)}</h3>
          <p class="font-body text-sm text-on-surface-variant line-clamp-2">${escapeHtml(horiz2.description)}</p>
        </div>
        <div class="flex gap-4 mt-4">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-primary">timer</span>
            <span class="font-label text-[10px] font-bold">${escapeHtml(horiz2.cookTime)}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[14px] text-secondary">eco</span>
            <span class="font-label text-[10px] font-bold">${escapeHtml(horiz2.difficulty).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  </article>` : ''}
</div>

<!-- Pro Tip -->
<section class="mt-16 p-8 rounded-2xl bg-tertiary-container/10 border-l-4 border-tertiary-fixed">
  <div class="flex items-start gap-4">
    <span class="material-symbols-outlined text-tertiary p-2 bg-tertiary-container/20 rounded-xl">lightbulb</span>
    <div>
      <h4 class="font-headline font-bold text-on-surface mb-1">${escapeHtml(tip?.title || t('results.chefSecretTitle', lang as Locale))}</h4>
      <p class="font-body text-on-surface-variant text-sm leading-relaxed">
        ${escapeHtml(tip?.text || t('results.chefSecretText', lang as Locale))}
      </p>
    </div>
  </div>
</section>

<script>
(function() {
  const slots = ${JSON.stringify(cards.filter(c => !c.imageUrl).map(c => c.id))};
  const pending = new Set(slots);

  function poll() {
    if (pending.size === 0) return;
    pending.forEach(async (id) => {
      try {
        const res = await fetch('/partials/image-slot?recipeId=' + id);
        const html = await res.text();
        if (html.includes('<img')) {
          const el = document.getElementById('image-slot-' + id);
          if (el) el.outerHTML = html;
          pending.delete(id);
        }
      } catch (e) {}
    });
    if (pending.size > 0) setTimeout(poll, 3000);
  }

  setTimeout(poll, 3000);
})();
</script>`;
}
