import type { APIRoute } from 'astro';
import { getSetting, setSetting, deleteSetting } from '../../../lib/settings';
import { clearProviderCache } from '../../../lib/ai/registry';
import { clearImageProviderCache } from '../../../lib/images/registry';

const ALLOWED_KEYS = ['ai_provider', 'ai_model', 'image_provider', 'image_model'];

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const formData = await request.formData();

  for (const key of ALLOWED_KEYS) {
    const value = formData.get(key) as string | null;
    if (value !== null) {
      const trimmed = value.trim();
      if (trimmed === '') {
        deleteSetting(key);
      } else {
        setSetting(key, trimmed);
      }
    }
  }

  // Invalidate cached provider instances so next request uses updated settings
  clearProviderCache();
  clearImageProviderCache();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || locals.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const result: Record<string, string | null> = {};
  for (const key of ALLOWED_KEYS) {
    result[key] = getSetting(key);
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};
