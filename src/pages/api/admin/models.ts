import type { APIRoute } from 'astro';
import { getAIProvider } from '../../../lib/ai/registry';
import { getImageProvider } from '../../../lib/images/registry';

export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const type = url.searchParams.get('type') || 'ai';

  try {
    let models: string[];

    if (type === 'image') {
      const provider = await getImageProvider();
      models = await provider.listModels();
    } else {
      const provider = await getAIProvider();
      models = await provider.listModels();
    }

    return new Response(JSON.stringify({ models }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    return new Response(JSON.stringify({ error: message, models: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
