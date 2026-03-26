import type { APIRoute } from 'astro';
import { getAIProvider } from '../../../lib/ai/registry';
import type { Locale } from '../../../lib/i18n/index';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const lang = (formData.get('lang') as Locale) || 'en';

    if (!imageFile) {
      return new Response('No image provided', { status: 400 });
    }

    if (imageFile.size > MAX_IMAGE_SIZE) {
      return new Response('Image too large (max 10 MB)', { status: 413 });
    }

    if (!imageFile.type.startsWith('image/')) {
      return new Response('Invalid file type', { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const provider = await getAIProvider();
    const ingredients = await provider.recognizeIngredients({
      imageBase64: base64,
      language: lang,
    });

    // Return HTML tags that can be injected via htmx
    const tagsHtml = ingredients
      .map(
        (name) => `
      <div class="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 py-2 px-4 rounded-full shadow-sm hover:shadow-md transition-shadow"
           x-data x-init="$store.ingredients.add('${name.replace(/'/g, "\\'")}')">
        <span class="text-sm font-medium">${escapeHtml(name)}</span>
        <button x-on:click="$store.ingredients.remove($store.ingredients.items.indexOf('${name.replace(/'/g, "\\'")}'))"
                class="text-outline hover:text-primary transition-colors">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>`,
      )
      .join('');

    return new Response(tagsHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Ingredient recognition error:', error);
    return new Response(
      `<p class="text-error text-sm">Could not identify ingredients. Please try again.</p>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
