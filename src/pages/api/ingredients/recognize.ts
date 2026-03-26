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

    return new Response(JSON.stringify(ingredients), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ingredient recognition error:', error);
    return new Response(JSON.stringify({ error: 'Could not identify ingredients' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
