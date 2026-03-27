import type { ImageProvider } from './provider';
import { getSetting } from '../settings';

const providerCache = new Map<string, ImageProvider>();

export async function getImageProvider(): Promise<ImageProvider> {
  const providerName = getSetting('image_provider') || process.env.IMAGE_PROVIDER || 'azure';
  const modelOverride = getSetting('image_model') || undefined;
  const cacheKey = `${providerName}:${modelOverride || 'default'}`;

  const cached = providerCache.get(cacheKey);
  if (cached) return cached;

  let provider: ImageProvider;

  switch (providerName) {
    case 'azure': {
      const { AzureImageProvider } = await import('./providers/azure-image');
      provider = new AzureImageProvider(modelOverride);
      break;
    }
    case 'placeholder':
    default: {
      const { PlaceholderImageProvider } = await import('./providers/placeholder');
      provider = new PlaceholderImageProvider();
      break;
    }
  }

  providerCache.set(cacheKey, provider);
  return provider;
}

export function clearImageProviderCache(): void {
  providerCache.clear();
}
